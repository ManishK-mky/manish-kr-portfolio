import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { paginationMeta } from '../common/dto/pagination-query.dto.js';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { deleteByIdOrThrow, findByIdOrThrow, nextOrder, reorder } from '../common/utils/crud.js';
import { escapeRegex } from '../common/utils/regex.js';
import { RESERVED_SLUGS, uniqueSlug } from '../common/utils/slug.js';
import { MediaReferenceRegistry } from '../media/media-reference.registry.js';
import { MediaService } from '../media/media.service.js';
import type {
  AdminProjectQueryDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import { Project } from './schemas/project.schema.js';

/** Fields omitted from list responses to keep cards light. */
const LIST_PROJECTION =
  '-description -challenges -responsibilities -features -gallery';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    private readonly media: MediaService,
    private readonly references: MediaReferenceRegistry,
    private readonly revalidation: RevalidationService,
  ) {}

  onModuleInit() {
    this.references.register('Projects', ({ id }) =>
      this.projects
        .countDocuments({ $or: [{ 'cover.mediaId': id }, { 'gallery.mediaId': id }] })
        .exec(),
    );
  }

  listPublic(query: ProjectQueryDto) {
    return this.paginate({ ...this.buildFilter(query), published: true }, query);
  }

  listAdmin(query: AdminProjectQueryDto) {
    const filter = this.buildFilter(query);
    if (query.status === 'published') filter.published = true;
    if (query.status === 'draft') filter.published = false;
    return this.paginate(filter, query, true);
  }

  featured(limit = 6) {
    return this.projects
      .find({ published: true, featured: true })
      .select(LIST_PROJECTION)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /** Distinct categories and technologies of published projects, for filters. */
  async facets() {
    const [categories, technologies] = await Promise.all([
      this.projects.distinct('category', { published: true, category: { $ne: '' } }).exec(),
      this.projects.distinct('technologies', { published: true }).exec(),
    ]);
    return { categories: categories.sort(), technologies: technologies.sort() };
  }

  async findPublicBySlug(slug: string) {
    const project = await this.projects.findOne({ slug, published: true }).lean().exec();
    if (!project) throw new NotFoundException('Project not found');
    // The next project in display order (wrapping around) for "next case study" links.
    const next =
      (await this.projects
        .findOne({ published: true, order: { $gt: project.order } })
        .sort({ order: 1 })
        .select('title slug summary cover')
        .lean()
        .exec()) ??
      (await this.projects
        .findOne({ published: true, _id: { $ne: project._id } })
        .sort({ order: 1 })
        .select('title slug summary cover')
        .lean()
        .exec());
    return { ...project, next };
  }

  findById(id: string) {
    return findByIdOrThrow(this.projects, id, 'Project');
  }

  async create(dto: CreateProjectDto) {
    const slug = dto.slug
      ? await this.assertSlugAvailable(dto.slug)
      : await uniqueSlug(dto.title, (s) => this.slugTaken(s));
    const project = await this.projects.create({
      ...this.scalarFields(dto),
      slug,
      cover: await this.media.resolveImage(dto.cover),
      gallery: await this.media.resolveGallery(dto.gallery),
      order: dto.order ?? (await nextOrder(this.projects)),
    });
    this.revalidate(project.slug);
    return project.toObject();
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.findById(id);
    const $set: Record<string, unknown> = this.scalarFields(dto, existing);
    if (dto.slug && dto.slug !== existing.slug) {
      $set.slug = await this.assertSlugAvailable(dto.slug, id);
    }
    if (dto.cover !== undefined) $set.cover = await this.media.resolveImage(dto.cover);
    if (dto.gallery !== undefined) {
      $set.gallery = await this.media.resolveGallery(dto.gallery);
    }
    const updated = await this.projects
      .findByIdAndUpdate(id, { $set }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    this.revalidate(existing.slug, updated?.slug);
    return updated;
  }

  async setStatus(id: string, published: boolean) {
    const project = await this.projects
      .findByIdAndUpdate(id, { published }, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!project) throw new NotFoundException('Project not found');
    this.revalidate(project.slug);
    return project;
  }

  async remove(id: string) {
    const project = await deleteByIdOrThrow(this.projects, id, 'Project');
    this.revalidate(project.slug);
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    const result = await reorder(this.projects, ids);
    this.revalidation.trigger(Tags.projects);
    return result;
  }

  countAll() {
    return Promise.all([
      this.projects.countDocuments().exec(),
      this.projects.countDocuments({ published: true }).exec(),
    ]).then(([total, published]) => ({ total, published, drafts: total - published }));
  }

  private buildFilter(query: ProjectQueryDto): QueryFilter<Project> {
    const filter: QueryFilter<Project> = {};
    if (query.category) filter.category = query.category;
    if (query.technology) filter.technologies = query.technology;
    if (query.featured !== undefined) filter.featured = query.featured;
    if (query.search) {
      const rx = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
      filter.$or = [{ title: rx }, { summary: rx }, { technologies: rx }];
    }
    return filter;
  }

  private async paginate(
    filter: QueryFilter<Project>,
    query: ProjectQueryDto,
    admin = false,
  ) {
    const [items, total] = await Promise.all([
      this.projects
        .find(filter)
        .select(admin ? '-description -challenges' : LIST_PROJECTION)
        .sort({ order: 1, createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.projects.countDocuments(filter).exec(),
    ]);
    return { items, meta: paginationMeta(query.page, query.limit, total) };
  }

  private scalarFields(
    dto: UpdateProjectDto,
    existing?: { startDate?: Date | null; endDate?: Date | null },
  ) {
    const { cover: _c, gallery: _g, slug: _s, startDate, endDate, ...rest } = dto;
    const out: Record<string, unknown> = { ...rest };
    if (startDate !== undefined) out.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) out.endDate = endDate ? new Date(endDate) : null;
    const start = 'startDate' in out ? (out.startDate as Date | null) : existing?.startDate;
    const end = 'endDate' in out ? (out.endDate as Date | null) : existing?.endDate;
    if (start && end && end < start) {
      throw new BadRequestException('endDate must be after startDate');
    }
    return out;
  }

  private async slugTaken(slug: string, exceptId?: string) {
    const filter: QueryFilter<Project> = { slug };
    if (exceptId) filter._id = { $ne: exceptId };
    return Boolean(await this.projects.exists(filter));
  }

  private async assertSlugAvailable(slug: string, exceptId?: string) {
    if (RESERVED_SLUGS.has(slug)) {
      throw new BadRequestException(`"${slug}" is a reserved slug`);
    }
    if (await this.slugTaken(slug, exceptId)) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }
    return slug;
  }

  private revalidate(...slugs: (string | undefined)[]) {
    this.revalidation.trigger(
      Tags.projects,
      ...slugs.filter((s): s is string => Boolean(s)).map(Tags.project),
    );
  }
}
