import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { paginationMeta } from '../common/dto/pagination-query.dto.js';
import { deleteByIdOrThrow } from '../common/utils/crud.js';
import { containsFilter } from '../common/utils/regex.js';
import { AppConfigService } from '../config/app-config.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { ContactQueryDto, CreateContactDto } from './dto/contact.dto.js';
import { ContactMessage } from './schemas/contact-message.schema.js';

/** Submissions faster than this after render are almost certainly bots. */
const MIN_FILL_MS = 2500;
const MAX_LINKS = 5;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactMessage.name) private readonly messages: Model<ContactMessage>,
    private readonly settings: SettingsService,
    private readonly config: AppConfigService,
  ) {}

  async submit(dto: CreateContactDto, userAgent?: string) {
    const settings = await this.settings.get();
    if (settings && settings.contactFormEnabled === false) {
      throw new ForbiddenException('The contact form is currently disabled');
    }

    // Bots get a normal-looking success so they don't learn to adapt.
    const tooFast = dto.startedAt !== undefined && Date.now() - dto.startedAt < MIN_FILL_MS;
    if (dto.website || tooFast) {
      this.logger.warn('Dropped a contact submission flagged as spam');
      return { received: true };
    }
    const links = dto.message.match(/https?:\/\//gi)?.length ?? 0;
    if (links > MAX_LINKS) {
      throw new BadRequestException('Please include fewer links in your message');
    }

    await this.messages.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject ?? '',
      message: dto.message,
      userAgent: userAgent?.slice(0, 300) ?? '',
    });
    void this.notify(dto);
    return { received: true };
  }

  async list(query: ContactQueryDto) {
    const filter: QueryFilter<ContactMessage> = {};
    if (query.status === 'unread') filter.read = false;
    if (query.status === 'read') filter.read = true;
    if (query.search) {
      const rx = containsFilter(query.search);
      filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
    }
    const [items, total] = await Promise.all([
      this.messages
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.messages.countDocuments(filter).exec(),
    ]);
    return { items, meta: paginationMeta(query.page, query.limit, total) };
  }

  async setRead(id: string, read: boolean) {
    const message = await this.messages
      .findByIdAndUpdate(id, { read }, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async remove(id: string) {
    await deleteByIdOrThrow(this.messages, id, 'Message');
    return { deleted: true };
  }

  unreadCount() {
    return this.messages.countDocuments({ read: false }).exec();
  }

  /** Optional email notification through Resend's HTTP API. */
  private async notify(dto: CreateContactDto) {
    const { resendApiKey, notifyTo, from } = this.config.email;
    if (!resendApiKey || !notifyTo || !from) return;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${resendApiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [notifyTo],
          reply_to: dto.email,
          subject: `Portfolio message: ${dto.subject || dto.name}`.slice(0, 200),
          text: `From: ${dto.name} <${dto.email}>\n\n${dto.message}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) this.logger.warn(`Email notification failed with ${res.status}`);
    } catch (err) {
      this.logger.warn(
        `Email notification failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
