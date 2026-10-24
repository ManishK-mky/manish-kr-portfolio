import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlogService } from '../blog/blog.service.js';
import { AdminOnly } from '../common/decorators/admin.decorator.js';
import { ContactService } from '../contact/contact.service.js';
import { EducationService } from '../education/education.service.js';
import { ExperienceService } from '../experience/experience.service.js';
import { MediaService } from '../media/media.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { SkillsService } from '../skills/skills.service.js';

@ApiTags('Dashboard')
@AdminOnly()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly blog: BlogService,
    private readonly experience: ExperienceService,
    private readonly education: EducationService,
    private readonly skills: SkillsService,
    private readonly media: MediaService,
    private readonly contact: ContactService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Summary counts for the admin overview' })
  async stats() {
    const [projects, posts, experience, education, skills, media, unreadMessages, recentPosts] =
      await Promise.all([
        this.projects.countAll(),
        this.blog.counts(),
        this.experience.count(),
        this.education.count(),
        this.skills.count(),
        this.media.count(),
        this.contact.unreadCount(),
        this.blog.recent(5),
      ]);
    return {
      projects,
      posts,
      experience,
      education,
      skills,
      media,
      unreadMessages,
      recentPosts,
    };
  }
}
