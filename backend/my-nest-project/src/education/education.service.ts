import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { deleteByIdOrThrow, findByIdOrThrow, nextOrder, reorder } from '../common/utils/crud.js';
import { MediaReferenceRegistry } from '../media/media-reference.registry.js';
import { MediaService } from '../media/media.service.js';
import type { CreateEducationDto, UpdateEducationDto } from './dto/education.dto.js';
import { Education } from './schemas/education.schema.js';

@Injectable()
export class EducationService implements OnModuleInit {
  constructor(
    @InjectModel(Education.name) private readonly education: Model<Education>,
    private readonly media: MediaService,
    private readonly references: MediaReferenceRegistry,
    private readonly revalidation: RevalidationService,
  ) {}

  onModuleInit() {
    this.references.register('Education', ({ id }) =>
      this.education.countDocuments({ 'logo.mediaId': id }).exec(),
    );
  }

  list() {
    return this.education.find().sort({ order: 1, endDate: -1 }).lean().exec();
  }

  findById(id: string) {
    return findByIdOrThrow(this.education, id, 'Education');
  }

  async create(dto: CreateEducationDto) {
    const created = await this.education.create({
      ...this.fields(dto),
      logo: await this.media.resolveImage(dto.logo),
      order: dto.order ?? (await nextOrder(this.education)),
    });
    this.revalidation.trigger(Tags.education);
    return created.toObject();
  }

  async update(id: string, dto: UpdateEducationDto) {
    const existing = await this.education.findById(id).lean().exec();
    if (!existing) throw new NotFoundException('Education not found');
    const $set = this.fields(dto, existing);
    if (dto.logo !== undefined) $set.logo = await this.media.resolveImage(dto.logo);
    const updated = await this.education
      .findByIdAndUpdate(id, { $set }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    this.revalidation.trigger(Tags.education);
    return updated;
  }

  async remove(id: string) {
    await deleteByIdOrThrow(this.education, id, 'Education');
    this.revalidation.trigger(Tags.education);
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    const result = await reorder(this.education, ids);
    this.revalidation.trigger(Tags.education);
    return result;
  }

  count() {
    return this.education.countDocuments().exec();
  }

  private fields(
    dto: UpdateEducationDto,
    existing?: { startDate?: Date | null; endDate?: Date | null },
  ) {
    const { logo: _l, startDate, endDate, ...rest } = dto;
    const out: Record<string, unknown> = { ...rest };
    if (startDate !== undefined) out.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) out.endDate = endDate ? new Date(endDate) : null;
    const s = 'startDate' in out ? (out.startDate as Date | null) : existing?.startDate;
    const e = 'endDate' in out ? (out.endDate as Date | null) : existing?.endDate;
    if (s && e && e < s) {
      throw new BadRequestException('Graduation date must be after the start date');
    }
    return out;
  }
}
