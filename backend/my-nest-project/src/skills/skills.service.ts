import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RevalidationService, Tags } from '../common/revalidation/revalidation.service.js';
import { deleteByIdOrThrow, nextOrder, reorder } from '../common/utils/crud.js';
import { uniqueSlug } from '../common/utils/slug.js';
import type {
  CreateSkillCategoryDto,
  CreateSkillDto,
  UpdateSkillCategoryDto,
  UpdateSkillDto,
} from './dto/skill.dto.js';
import { Skill, SkillCategory } from './schemas/skill.schema.js';

@Injectable()
export class SkillsService {
  constructor(
    @InjectModel(Skill.name) private readonly skills: Model<Skill>,
    @InjectModel(SkillCategory.name) private readonly categories: Model<SkillCategory>,
    private readonly revalidation: RevalidationService,
  ) {}

  // ── Skills ──────────────────────────────────────────────────────────────

  list(featuredOnly = false) {
    return this.skills
      .find(featuredOnly ? { featured: true } : {})
      .populate('category', 'name slug order')
      .sort({ order: 1, name: 1 })
      .lean()
      .exec();
  }

  /** Categories in order, each with its skills — the shape the public page renders. */
  async grouped() {
    const [categories, skills] = await Promise.all([
      this.categories.find().sort({ order: 1, name: 1 }).lean().exec(),
      this.skills.find().sort({ order: 1, name: 1 }).lean().exec(),
    ]);
    return categories
      .map((c) => ({
        ...c,
        skills: skills.filter((s) => s.category.equals(c._id)),
      }))
      .filter((c) => c.skills.length > 0);
  }

  async create(dto: CreateSkillDto) {
    await this.assertCategory(dto.category);
    const skill = await this.skills.create({
      ...dto,
      category: new Types.ObjectId(dto.category),
      order: dto.order ?? (await nextOrder(this.skills, { category: dto.category })),
    });
    this.revalidation.trigger(Tags.skills);
    return skill.toObject();
  }

  async update(id: string, dto: UpdateSkillDto) {
    if (dto.category) await this.assertCategory(dto.category);
    const skill = await this.skills
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    if (!skill) throw new NotFoundException('Skill not found');
    this.revalidation.trigger(Tags.skills);
    return skill;
  }

  async remove(id: string) {
    await deleteByIdOrThrow(this.skills, id, 'Skill');
    this.revalidation.trigger(Tags.skills);
    return { deleted: true };
  }

  async reorder(ids: string[]) {
    const result = await reorder(this.skills, ids);
    this.revalidation.trigger(Tags.skills);
    return result;
  }

  count() {
    return this.skills.countDocuments().exec();
  }

  // ── Categories ──────────────────────────────────────────────────────────

  listCategories() {
    return this.categories.find().sort({ order: 1, name: 1 }).lean().exec();
  }

  async createCategory(dto: CreateSkillCategoryDto) {
    const slug = await uniqueSlug(dto.name, async (s) =>
      Boolean(await this.categories.exists({ slug: s })),
    );
    const category = await this.categories.create({
      ...dto,
      slug,
      order: dto.order ?? (await nextOrder(this.categories)),
    });
    this.revalidation.trigger(Tags.skills);
    return category.toObject();
  }

  async updateCategory(id: string, dto: UpdateSkillCategoryDto) {
    const category = await this.categories
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after', runValidators: true })
      .lean()
      .exec();
    if (!category) throw new NotFoundException('Skill category not found');
    this.revalidation.trigger(Tags.skills);
    return category;
  }

  async removeCategory(id: string) {
    const used = await this.skills.countDocuments({ category: new Types.ObjectId(id) }).exec();
    if (used > 0) {
      throw new ConflictException(
        `This category still contains ${used} skill(s). Move or delete them first.`,
      );
    }
    await deleteByIdOrThrow(this.categories, id, 'Skill category');
    this.revalidation.trigger(Tags.skills);
    return { deleted: true };
  }

  async reorderCategories(ids: string[]) {
    const result = await reorder(this.categories, ids);
    this.revalidation.trigger(Tags.skills);
    return result;
  }

  private async assertCategory(id: string) {
    if (!(await this.categories.exists({ _id: id }))) {
      throw new BadRequestException('Skill category does not exist');
    }
  }
}
