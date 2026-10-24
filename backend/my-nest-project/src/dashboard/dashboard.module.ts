import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module.js';
import { ContactModule } from '../contact/contact.module.js';
import { EducationModule } from '../education/education.module.js';
import { ExperienceModule } from '../experience/experience.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [
    ProjectsModule,
    BlogModule,
    ExperienceModule,
    EducationModule,
    SkillsModule,
    ContactModule,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
