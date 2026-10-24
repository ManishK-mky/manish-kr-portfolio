import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginationMeta } from '../common/dto/pagination-query.dto.js';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { RESERVED_SLUGS, uniqueSlug } from '../common/utils/slug.js';
import { MediaReferenceRegistry } from '../media/media-reference.registry.js';
import { MediaService } from '../media/media.service.js';
import { ProfileService } from '../profile/profile.service.js';
import type {
  AdminPostQueryDto,
  CreatePostDto,
  PostQueryDto,
  UpdatePostDto,
} from './dto/blog-post.dto.js';
import {
  EMPTY_DOC,
  InvalidContentError,
  renderTiptap,
  type TiptapNode,
} from './rendering/tiptap-renderer.js';
import { BlogPost, type PostStatus } from './schemas/blog-post.schema.js';
import { BlogCategory, BlogTag } from './schemas/blog-taxonomy.schema.js';

const LIST_PROJECTION = '-content -html -toc -inlineImages';

/**
 * The single definition of "publicly visible". Scheduled posts become visible
 * the moment their date passes, even before the cron flips their status.
 */
export const publicFilter = (now = new Date()): QueryFilter<BlogPost> => ({
  status: { $in: ['published', 'scheduled'] },
  publishedAt: { $ne: null, $lte: now },
});

@Injectable()
export class BlogService implements OnModuleInit {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectModel(BlogPost.name) private readonly posts: Model<BlogPost>,
    @InjectModel(BlogCategory.name) private readonly categories: Model<BlogCategory>,
    @InjectModel(BlogTag.name) private readonly tags: Model<BlogTag>,
    private readonly media: MediaService,
    private readonly profile: ProfileService,
    private readonly references: MediaReferenceRegistry,
    private readonly revalidation: RevalidationService,
  ) {}

  onModuleInit() {
    this.references.register('Blog posts', ({ id, url }) =>
      this.posts
        .countDocuments({ $or: [{ 'coverImage.mediaId': id }, { inlineImages: url }] })
        .exec(),
    );
  }

  // ── Public ──────────────────────────────────────────────────────────────

  async listPublic(query: PostQueryDto) {
    const filter = publicFilter();
    if (query.featured === 'true') filter.featured = true;
    if (query.category) {
      const cat = await this.categories.findOne({ slug: query.category }).lean().exec();
      if (!cat) return { items: [], meta: paginationMeta(query.page, query.limit, 0) };
      filter.category = cat._id;
    }
    if (query.tag) {
      const tag = await this.tags.findOne({ slug: query.tag }).lean().exec();
      if (!tag) return { items: [], meta: paginationMeta(query.page, query.limit, 0) };
      filter.tags = tag._id;
    }
    return this.paginate(filter, query, { publishedAt: -1 });
  }

  async findPublicBySlug(slug: string) {
    const post = await this.posts
      .findOne({ ...publicFilter(), slug })
      .select('-content -inlineImages')
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .lean()
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return { ...post, related: await this.related(post) };
  }

  /** Slugs and dates of every public post, for the sitemap. */
  sitemap() {
    return this.posts
      .find(publicFilter())
      .select('slug publishedAt updatedAt')
      .sort({ publishedAt: -1 })
      .limit(5000)
      .lean()
      .exec();
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  async listAdmin(query: AdminPostQueryDto) {
    const filter: QueryFilter<BlogPost> = {};
    if (query.status !== 'all') filter.status = query.status;
    if (query.featured === 'true') filter.featured = true;
    if (query.category) {
      const cat = await this.categories.findOne({ slug: query.category }).lean().exec();
      filter.category = cat?._id ?? new Types.ObjectId();
    }
    if (query.tag) {
      const tag = await this.tags.findOne({ slug: query.tag }).lean().exec();
      filter.tags = tag?._id ?? new Types.ObjectId();
    }
    return this.paginate(filter, query, { updatedAt: -1 });
  }

  async findById(id: string) {
    const post = await this.posts
      .findById(id)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .lean()
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto) {
    const slug = dto.slug
      ? await this.assertSlugAvailable(dto.slug)
      : await uniqueSlug(dto.title, (s) => this.slugTaken(s));
    const content = dto.content ?? EMPTY_DOC;
    const rendered = this.render(content);
    const { status, publishedAt } = this.resolvePublication(
      dto.status ?? 'draft',
      dto.publishedAt,
      null,
    );
    const author = await this.author(dto.authorName);

    const post = await this.posts.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt || this.autoExcerpt(rendered.contentText),
      coverImage: await this.media.resolveImage(dto.coverImage),
      content,
      ...rendered,
      author,
      category: await this.resolveCategory(dto.category),
      tags: await this.resolveTags(dto.tags),
      status,
      publishedAt,
      featured: dto.featured ?? false,
      seo: dto.seo ?? {},
    });
    this.revalidateIfPublic(post.status, post.slug);
    return this.findById(post.id);
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.posts.findById(id).lean().exec();
    if (!existing) throw new NotFoundException('Post not found');

    const $set: Record<string, unknown> = {};
    for (const key of ['title', 'excerpt', 'featured'] as const) {
      if (dto[key] !== undefined) $set[key] = dto[key];
    }
    if (dto.slug && dto.slug !== existing.slug) {
      $set.slug = await this.assertSlugAvailable(dto.slug, id);
    }
    if (dto.content !== undefined) {
      $set.content = dto.content;
      Object.assign($set, this.render(dto.content));
    }
    if (dto.coverImage !== undefined) {
      $set.coverImage = await this.media.resolveImage(dto.coverImage);
    }
    if (dto.category !== undefined) $set.category = await this.resolveCategory(dto.category);
    if (dto.tags !== undefined) $set.tags = await this.resolveTags(dto.tags);
    if (dto.authorName !== undefined) $set.author = await this.author(dto.authorName);
    if (dto.seo) {
      for (const [k, v] of Object.entries(dto.seo)) {
        if (v !== undefined) $set[`seo.${k}`] = v;
      }
    }
    if (dto.status !== undefined || dto.publishedAt !== undefined) {
      Object.assign(
        $set,
        this.resolvePublication(
          dto.status ?? existing.status,
          dto.publishedAt,
          existing.publishedAt,
        ),
      );
    }

    await this.posts.updateOne({ _id: id }, { $set }, { runValidators: true }).exec();
    const updated = await this.findById(id);
    // Revalidate when the post is, or was, public — unpublishing must purge it too.
    this.revalidation.trigger(
      Tags.blog,
      Tags.post(existing.slug),
      Tags.post(updated.slug),
    );
    return updated;
  }

  async setStatus(id: string, status: PostStatus, publishedAt?: string) {
    return this.update(id, { status, publishedAt });
  }

  async remove(id: string) {
    const post = await this.posts.findByIdAndDelete(id).lean().exec();
    if (!post) throw new NotFoundException('Post not found');
    this.revalidation.trigger(Tags.blog, Tags.post(post.slug));
    return { deleted: true };
  }

  /**
   * Renders a post as the public page would, without publishing it. Unsaved
   * editor content may be passed to preview edits before saving.
   */
  async preview(id: string, content?: TiptapNode) {
    const post = await this.findById(id);
    if (!content) return post;
    return { ...post, content, ...this.render(content) };
  }

  async counts() {
    const rows = await this.posts
      .aggregate<{ _id: PostStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();
    const by = Object.fromEntries(rows.map((r) => [r._id, r.count]));
    return {
      total: rows.reduce((n, r) => n + r.count, 0),
      published: by.published ?? 0,
      drafts: by.draft ?? 0,
      scheduled: by.scheduled ?? 0,
    };
  }

  recent(limit = 5) {
    return this.posts
      .find()
      .select('title slug status publishedAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /** Flips due scheduled posts to published and refreshes the frontend cache. */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'publish-scheduled-posts' })
  async publishDuePosts() {
    const due = await this.posts
      .find({ status: 'scheduled', publishedAt: { $lte: new Date() } })
      .select('slug')
      .lean()
      .exec();
    if (due.length === 0) return 0;
    await this.posts
      .updateMany({ _id: { $in: due.map((p) => p._id) } }, { status: 'published' })
      .exec();
    this.logger.log(`Published ${due.length} scheduled post(s)`);
    this.revalidation.trigger(Tags.blog, ...due.map((p) => Tags.post(p.slug)));
    return due.length;
  }

  // ── Taxonomy ────────────────────────────────────────────────────────────

  /** Categories or tags with the number of public posts using each. */
  async listTaxonomy(kind: 'category' | 'tag', includeEmpty = false) {
    const model = kind === 'category' ? this.categories : this.tags;
    const field = kind === 'category' ? '$category' : '$tags';
    const [terms, counts] = await Promise.all([
      (model as Model<BlogCategory | BlogTag>).find().sort({ name: 1 }).lean().exec(),
      this.posts
        .aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: publicFilter() },
          ...(kind === 'tag' ? [{ $unwind: '$tags' }] : []),
          { $group: { _id: field, count: { $sum: 1 } } },
        ])
        .exec(),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.count]));
    return terms
      .map((t) => ({ ...t, postCount: byId.get(String(t._id)) ?? 0 }))
      .filter((t) => includeEmpty || t.postCount > 0);
  }

  async createTaxonomy(kind: 'category' | 'tag', name: string, description?: string) {
    const model = (kind === 'category' ? this.categories : this.tags) as Model<BlogCategory>;
    const slug = await uniqueSlug(name, async (s) => Boolean(await model.exists({ slug: s })));
    const doc = await model.create(
      kind === 'category' ? { name, slug, description: description ?? '' } : { name, slug },
    );
    this.revalidation.trigger(Tags.blogTaxonomy, Tags.blog);
    return doc.toObject();
  }

  async updateTaxonomy(
    kind: 'category' | 'tag',
    id: string,
    dto: { name?: string; description?: string },
  ) {
    const model = (kind === 'category' ? this.categories : this.tags) as Model<BlogCategory>;
    const $set: Record<string, unknown> = {};
    if (dto.name !== undefined) $set.name = dto.name;
    if (kind === 'category' && dto.description !== undefined) {
      $set.description = dto.description;
    }
    const doc = await model
      .findByIdAndUpdate(id, { $set }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException(`${kind === 'category' ? 'Category' : 'Tag'} not found`);
    this.revalidation.trigger(Tags.blogTaxonomy, Tags.blog);
    return doc;
  }

  /** Deleting a term detaches it from posts rather than deleting posts. */
  async removeTaxonomy(kind: 'category' | 'tag', id: string) {
    const oid = new Types.ObjectId(id);
    if (kind === 'category') {
      const doc = await this.categories.findByIdAndDelete(id).lean().exec();
      if (!doc) throw new NotFoundException('Category not found');
      await this.posts.updateMany({ category: oid }, { category: null }).exec();
    } else {
      const doc = await this.tags.findByIdAndDelete(id).lean().exec();
      if (!doc) throw new NotFoundException('Tag not found');
      await this.posts.updateMany({ tags: oid }, { $pull: { tags: oid } }).exec();
    }
    this.revalidation.trigger(Tags.blogTaxonomy, Tags.blog);
    return { deleted: true };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private render(content: TiptapNode) {
    try {
      const r = renderTiptap(content);
      return {
        html: r.html,
        toc: r.toc,
        contentText: r.text,
        wordCount: r.wordCount,
        readingTime: r.readingTime,
        inlineImages: r.imageUrls,
      };
    } catch (err) {
      if (err instanceof InvalidContentError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  /**
   * Normalizes status and date together:
   * - draft keeps any earlier publish date (so republishing keeps it),
   * - published defaults the date to now; a future date means scheduled,
   * - scheduled requires a future date.
   */
  private resolvePublication(
    status: PostStatus,
    requested: string | null | undefined,
    existing: Date | null,
  ): { status: PostStatus; publishedAt: Date | null } {
    const now = new Date();
    const date = requested ? new Date(requested) : requested === null ? null : existing;
    if (status === 'draft') return { status, publishedAt: date };
    if (status === 'scheduled') {
      if (!date || date <= now) {
        throw new BadRequestException('Scheduled posts need a publish date in the future');
      }
      return { status, publishedAt: date };
    }
    // "Publish" without an explicit date means now, even if a future date was
    // stored by an earlier schedule. An explicit future date still schedules.
    const publishedAt = requested ? date! : date && date <= now ? date : now;
    return { status: publishedAt > now ? 'scheduled' : 'published', publishedAt };
  }

  private async related(post: {
    _id: Types.ObjectId;
    category: unknown;
    tags: unknown[];
  }) {
    const tagIds = (post.tags as { _id: Types.ObjectId }[]).map((t) => t._id);
    const categoryId = (post.category as { _id?: Types.ObjectId } | null)?._id;
    const or: QueryFilter<BlogPost>[] = [];
    if (tagIds.length) or.push({ tags: { $in: tagIds } });
    if (categoryId) or.push({ category: categoryId });
    const base = { ...publicFilter(), _id: { $ne: post._id } };
    const fields = 'title slug excerpt coverImage publishedAt readingTime';
    const matches = or.length
      ? await this.posts
          .find({ ...base, $or: or })
          .select(fields)
          .sort({ publishedAt: -1 })
          .limit(3)
          .lean()
          .exec()
      : [];
    if (matches.length >= 3) return matches;
    const filler = await this.posts
      .find({ ...base, _id: { $nin: [post._id, ...matches.map((m) => m._id)] } })
      .select(fields)
      .sort({ publishedAt: -1 })
      .limit(3 - matches.length)
      .lean()
      .exec();
    return [...matches, ...filler];
  }

  private async paginate(
    filter: QueryFilter<BlogPost>,
    query: PostQueryDto,
    sort: Record<string, 1 | -1>,
  ) {
    const search = query.search?.trim();
    const finalFilter = search ? { ...filter, $text: { $search: search } } : filter;
    const [items, total] = await Promise.all([
      this.posts
        .find(finalFilter)
        .select(LIST_PROJECTION)
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .sort(search ? { score: { $meta: 'textScore' }, ...sort } : sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean()
        .exec(),
      this.posts.countDocuments(finalFilter).exec(),
    ]);
    return { items, meta: paginationMeta(query.page, query.limit, total) };
  }

  private async author(nameOverride?: string) {
    const profile = await this.profile.get();
    return {
      name: nameOverride || profile.name,
      avatarUrl: profile.avatar?.url ?? '',
    };
  }

  private autoExcerpt(text: string) {
    if (text.length <= 220) return text;
    return `${text.slice(0, 220).replace(/\s+\S*$/, '')}…`;
  }

  private async resolveCategory(id: string | null | undefined) {
    if (!id) return null;
    if (!(await this.categories.exists({ _id: id }))) {
      throw new BadRequestException('Category does not exist');
    }
    return new Types.ObjectId(id);
  }

  private async resolveTags(ids: string[] | undefined) {
    if (!ids?.length) return [];
    const found = await this.tags.countDocuments({ _id: { $in: ids } }).exec();
    if (found !== ids.length) throw new BadRequestException('One or more tags do not exist');
    return ids.map((id) => new Types.ObjectId(id));
  }

  private async slugTaken(slug: string, exceptId?: string) {
    const filter: QueryFilter<BlogPost> = { slug };
    if (exceptId) filter._id = { $ne: exceptId };
    return Boolean(await this.posts.exists(filter));
  }

  private async assertSlugAvailable(slug: string, exceptId?: string) {
    if (RESERVED_SLUGS.has(slug)) throw new BadRequestException(`"${slug}" is a reserved slug`);
    if (await this.slugTaken(slug, exceptId)) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }
    return slug;
  }

  private revalidateIfPublic(status: PostStatus, slug: string) {
    if (status !== 'draft') this.revalidation.trigger(Tags.blog, Tags.post(slug));
  }
}
