import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../companies/schemas/company.schema.js';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { deleteByIdOrThrow, nextOrder, reorder } from '../common/utils/crud.js';
import type { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto.js';
import { Experience } from './schemas/experience.schema.js';

const COMPANY_FIELDS = 'name slug logo website location industry';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectModel(Experience.name) private readonly experience: Model<Experience>,
    @InjectModel(Company.name) private readonly companies: Model<Company>,
    private readonly revalidation: RevalidationService,
  ) {}

  /** Positions with their company populated, newest first within display order. */
  list() {
    return this.experience
      .find()
      .populate('company', COMPANY_FIELDS)
      .sort({ order: 1, startDate: -1 })
      .lean()
      .exec();
  }

  async findById(id: string) {
    const doc = await this.experience
      .findById(id)
      .populate('company', COMPANY_FIELDS)
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Experience not found');
    return doc;
  }

  async create(dto: CreateExperienceDto) {
    await this.assertCompany(dto.company);
    const fields = this.normalize(dto);
    const created = await this.experience.create({
      ...fields,
      order: dto.order ?? (await nextOrder(this.experience)),
    });
    this.revalidation.trigger(Tags.experience);
    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateExperienceDto) {
    const existing = await this.experience.findById(id).lean().exec();
    if (!existing) throw new NotFoundException('Experience not found');
    if (dto.company) await this.assertCompany(dto.company);
    const fields = this.normalize(dto, existing);
    await this.experience
      .updateOne({ _id: id }, { $set: fields }, { runValidators: true })
      .exec();
    this.revalidation.trigger(Tags.experience);
    return this.findById(id);
  }

  async remove(id: string) {
    await deleteByIdOrThrow(this.experience, id, 'Experience');
    this.revalidation.trigger(Tags.experience);
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    const result = await reorder(this.experience, ids);
    this.revalidation.trigger(Tags.experience);
    return result;
  }

  count() {
    return this.experience.countDocuments().exec();
  }

  private async assertCompany(id: string) {
    if (!(await this.companies.exists({ _id: id }))) {
      throw new BadRequestException('Company does not exist');
    }
  }

  /** A current position has no end date; otherwise the end must follow the start. */
  private normalize(
    dto: UpdateExperienceDto,
    existing?: { startDate: Date; endDate: Date | null; current: boolean },
  ) {
    const { startDate, endDate, ...rest } = dto;
    const out: Record<string, unknown> = { ...rest };
    if (startDate !== undefined) out.startDate = new Date(startDate);
    if (endDate !== undefined) out.endDate = endDate ? new Date(endDate) : null;

    const current = dto.current ?? existing?.current ?? false;
    if (current) out.endDate = null;

    const start = (out.startDate as Date | undefined) ?? existing?.startDate;
    const end =
      out.endDate !== undefined ? (out.endDate as Date | null) : (existing?.endDate ?? null);
    if (start && end && end < start) {
      throw new BadRequestException('endDate must be after startDate');
    }
    return out;
  }
}
