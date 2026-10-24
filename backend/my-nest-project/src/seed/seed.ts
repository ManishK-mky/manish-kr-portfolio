/**
 * Seeds a fresh database with sample content and (optionally) the first admin.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' npm run seed
 *
 * Safe to re-run: each collection is only seeded while it is empty, and an
 * existing admin is never modified. Passwords are never hardcoded or logged.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AppModule } from '../app.module.js';
import { BlogService } from '../blog/blog.service.js';
import { BlogPost } from '../blog/schemas/blog-post.schema.js';
import { CompaniesService } from '../companies/companies.service.js';
import { Company } from '../companies/schemas/company.schema.js';
import { EducationService } from '../education/education.service.js';
import { Education } from '../education/schemas/education.schema.js';
import { ExperienceService } from '../experience/experience.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { Profile } from '../profile/schemas/profile.schema.js';
import { ProjectsService } from '../projects/projects.service.js';
import { Project } from '../projects/schemas/project.schema.js';
import { SiteSettings } from '../settings/schemas/site-settings.schema.js';
import { SettingsService } from '../settings/settings.service.js';
import { SkillCategory } from '../skills/schemas/skill.schema.js';
import { SkillsService } from '../skills/skills.service.js';
import { SocialLink } from '../social-links/schemas/social-link.schema.js';
import { SocialLinksService } from '../social-links/social-links.service.js';
import { MIN_PASSWORD_LENGTH, UsersService } from '../users/users.service.js';
import * as sample from './sample-content.js';

const logger = new Logger('Seed');

async function main() {
  const adminOnly = process.argv.includes('--admin-only');
  // Don't ping the frontend while seeding.
  delete process.env.FRONTEND_REVALIDATE_URL;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const model = <T>(name: string) => app.get<Model<T>>(getModelToken(name));
  const isEmpty = async (name: string) => (await model(name).estimatedDocumentCount()) === 0;

  try {
    await seedAdmin(app.get(UsersService));
    if (adminOnly) return;

    if (await isEmpty(Profile.name)) {
      await app.get(ProfileService).update({ ...sample.sampleProfile, stats: [...sample.sampleProfile.stats] });
      logger.log('Profile created');
    }

    if (await isEmpty(SiteSettings.name)) {
      await app.get(SettingsService).update(sample.sampleSettings);
      logger.log('Site settings created');
    }

    if (await isEmpty(SocialLink.name)) {
      const links = app.get(SocialLinksService);
      for (const link of sample.sampleSocialLinks) await links.create({ ...link });
      logger.log(`${sample.sampleSocialLinks.length} social links created`);
    }

    if (await isEmpty(SkillCategory.name)) {
      const skills = app.get(SkillsService);
      for (const [categoryName, items] of Object.entries(sample.sampleSkills)) {
        const category = await skills.createCategory({ name: categoryName });
        for (const item of items) {
          await skills.create({
            name: item.name,
            icon: item.icon,
            proficiency: (item.proficiency as 'Expert') ?? null,
            featured: item.featured ?? false,
            category: String(category._id),
          });
        }
      }
      logger.log('Skill categories and skills created');
    }

    if (await isEmpty(Company.name)) {
      const companies = app.get(CompaniesService);
      const experience = app.get(ExperienceService);
      const ids = new Map<string, string>();
      for (const c of sample.sampleCompanies) {
        const created = await companies.create({ ...c });
        ids.set(c.name, String(created._id));
      }
      for (const e of sample.sampleExperience) {
        await experience.create({
          ...e,
          company: ids.get(e.company)!,
          responsibilities: [...e.responsibilities],
          achievements: [...e.achievements],
          technologies: [...e.technologies],
        });
      }
      logger.log('Companies and experience created');
    }

    if (sample.sampleEducation.length && (await isEmpty(Education.name))) {
      const education = app.get(EducationService);
      for (const e of sample.sampleEducation) {
        await education.create({
          ...e,
          coursework: [...e.coursework],
          achievements: [...e.achievements],
          activities: [...e.activities],
        });
      }
      logger.log('Education created');
    }

    if (await isEmpty(Project.name)) {
      const projects = app.get(ProjectsService);
      for (const p of sample.sampleProjects) {
        await projects.create({
          ...p,
          technologies: [...p.technologies],
          responsibilities: [...p.responsibilities],
          challenges: (p.challenges as readonly { challenge: string; solution: string }[]).map((c) => ({ ...c })),
          features: [...p.features],
          achievements: [...p.achievements],
          published: true,
        });
      }
      logger.log(`${sample.sampleProjects.length} projects created`);
    }

    if (sample.samplePosts.length && (await isEmpty(BlogPost.name))) {
      const blog = app.get(BlogService);
      const categoryIds = new Map<string, string>();
      const tagIds = new Map<string, string>();
      for (const post of sample.samplePosts) {
        if (!categoryIds.has(post.category)) {
          const c = await blog.createTaxonomy('category', post.category);
          categoryIds.set(post.category, String(c._id));
        }
        for (const tag of post.tags) {
          if (!tagIds.has(tag)) {
            const t = await blog.createTaxonomy('tag', tag);
            tagIds.set(tag, String(t._id));
          }
        }
        await blog.create({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: categoryIds.get(post.category),
          tags: post.tags.map((t) => tagIds.get(t)!),
          featured: post.featured,
          status: 'published',
        });
      }
      logger.log(`${sample.samplePosts.length} blog posts created`);
    }

    logger.log('Seeding complete');
  } finally {
    await app.close();
  }
}

async function seedAdmin(users: UsersService) {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if ((await users.count()) > 0) {
    logger.log('An admin account already exists — skipping admin creation');
    return;
  }
  if (!email || !password) {
    logger.warn(
      'No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) to create one.',
    );
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  await users.createAdmin(email, process.env.ADMIN_NAME?.trim() || 'Admin', password);
  logger.log(`Admin account created for ${email}`);
}

main().catch((err: unknown) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
