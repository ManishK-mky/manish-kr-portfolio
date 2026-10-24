import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { findByIdOrThrow } from '../common/utils/crud.js';
import { containsFilter } from '../common/utils/regex.js';
import { uniqueSlug } from '../common/utils/slug.js';
import { Experience } from '../experience/schemas/experience.schema.js';
import { MediaReferenceRegistry } from '../media/media-reference.registry.js';
import { MediaService } from '../media/media.service.js';
import type { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto.js';
import { Company } from './schemas/company.schema.js';

@Injectable()
export class CompaniesService implements OnModuleInit {
  constructor(
    @InjectModel(Company.name) private readonly companies: Model<Company>,
    @InjectModel(Experience.name) private readonly experience: Model<Experience>,
    private readonly media: MediaService,
    private readonly references: MediaReferenceRegistry,
    private readonly revalidation: RevalidationService,
  ) {}

  onModuleInit() {
    this.references.register('Companies', ({ id }) =>
      this.companies.countDocuments({ 'logo.mediaId': id }).exec(),
    );
  }

  list(search?: string) {
    return this.companies
      .find(search ? { name: containsFilter(search) } : {})
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  findById(id: string) {
    return findByIdOrThrow(this.companies, id, 'Company');
  }

  async create(dto: CreateCompanyDto) {
    const slug = await uniqueSlug(dto.name, async (s) =>
      Boolean(await this.companies.exists({ slug: s })),
    );
    const company = await this.companies.create({
      ...dto,
      slug,
      logo: await this.media.resolveImage(dto.logo),
    });
    this.revalidate();
    return company.toObject();
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const { logo, ...rest } = dto;
    const $set: Record<string, unknown> = { ...rest };
    if (logo !== undefined) $set.logo = await this.media.resolveImage(logo);
    const company = await this.companies
      .findByIdAndUpdate(id, { $set }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    if (!company) throw new NotFoundException('Company not found');
    this.revalidate();
    return company;
  }

  async remove(id: string) {
    const positions = await this.experience
      .countDocuments({ company: new Types.ObjectId(id) })
      .exec();
    if (positions > 0) {
      throw new ConflictException(
        `This company is used by ${positions} experience record(s). Remove or reassign them first.`,
      );
    }
    const deleted = await this.companies.findByIdAndDelete(id).lean().exec();
    if (!deleted) throw new NotFoundException('Company not found');
    this.revalidate();
    return { deleted: true };
  }

  private revalidate() {
    // Company details are rendered inside the experience timeline.
    this.revalidation.trigger(Tags.companies, Tags.experience);
  }
}
