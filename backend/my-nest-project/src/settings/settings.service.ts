import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { MediaReferenceRegistry } from '../media/media-reference.registry.js';
import { MediaService } from '../media/media.service.js';
import type { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SiteSettings } from './schemas/site-settings.schema.js';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectModel(SiteSettings.name) private readonly settings: Model<SiteSettings>,
    private readonly media: MediaService,
    private readonly references: MediaReferenceRegistry,
    private readonly revalidation: RevalidationService,
  ) {}

  onModuleInit() {
    this.references.register('Site settings', ({ id }) =>
      this.settings.countDocuments({ 'ogImage.mediaId': id }).exec(),
    );
  }

  /** Returns the stored settings, creating the defaults on first access. */
  async get() {
    return this.settings
      .findOneAndUpdate(
        { key: 'main' },
        { $setOnInsert: { key: 'main' } },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
  }

  async update(dto: UpdateSettingsDto) {
    const { ogImage, ...rest } = dto;
    const $set: Record<string, unknown> = { ...rest };
    if (ogImage !== undefined) $set.ogImage = await this.media.resolveImage(ogImage);
    if (typeof $set.siteUrl === 'string') {
      $set.siteUrl = $set.siteUrl.replace(/\/$/, '');
    }
    const settings = await this.settings
      .findOneAndUpdate(
        { key: 'main' },
        { $set },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .lean()
      .exec();
    this.revalidation.trigger(Tags.settings);
    return settings;
  }
}
