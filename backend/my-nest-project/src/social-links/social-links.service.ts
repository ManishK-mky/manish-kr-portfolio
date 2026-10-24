import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { deleteByIdOrThrow, nextOrder, reorder } from '../common/utils/crud.js';
import type { CreateSocialLinkDto, UpdateSocialLinkDto } from './dto/social-link.dto.js';
import { SocialLink } from './schemas/social-link.schema.js';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectModel(SocialLink.name) private readonly links: Model<SocialLink>,
    private readonly revalidation: RevalidationService,
  ) {}

  list(includeHidden = false) {
    return this.links
      .find(includeHidden ? {} : { visible: true })
      .sort({ order: 1, createdAt: 1 })
      .lean()
      .exec();
  }

  async create(dto: CreateSocialLinkDto) {
    const order = dto.order ?? (await nextOrder(this.links));
    const link = await this.links.create({ ...dto, order });
    this.revalidation.trigger(Tags.socialLinks);
    return link.toObject();
  }

  async update(id: string, dto: UpdateSocialLinkDto) {
    const link = await this.links
      .findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    if (!link) throw new NotFoundException('Social link not found');
    this.revalidation.trigger(Tags.socialLinks);
    return link;
  }

  async remove(id: string) {
    await deleteByIdOrThrow(this.links, id, 'Social link');
    this.revalidation.trigger(Tags.socialLinks);
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    const result = await reorder(this.links, ids);
    this.revalidation.trigger(Tags.socialLinks);
    return result;
  }
}
