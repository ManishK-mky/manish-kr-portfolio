import { ContactSection } from "@/features/contact/contact-section";
import { EducationList } from "@/features/portfolio/education-list";
import { ExperienceTimeline } from "@/features/portfolio/experience-timeline";
import { FeaturedWork } from "@/features/portfolio/featured-work";
import { Hero } from "@/features/portfolio/hero";
import { LatestWriting } from "@/features/portfolio/latest-writing";
import { SkillsGrid } from "@/features/portfolio/skills-grid";
import { JsonLd } from "@/components/site/json-ld";
import {
  getEducation,
  getExperience,
  getFeaturedProjects,
  getPosts,
  getProfile,
  getSettings,
  getSkillGroups,
  getSocialLinks,
} from "@/lib/api/public";

export default async function HomePage() {
  const [profile, settings, links, projects, experience, education, skills, posts] = await Promise.all([
    getProfile(),
    getSettings(),
    getSocialLinks(),
    getFeaturedProjects(4),
    getExperience(),
    getEducation(),
    getSkillGroups(),
    getPosts({}, 3),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.name,
          jobTitle: profile.role,
          description: profile.intro || settings.siteDescription,
          image: profile.avatar?.url,
          email: profile.email ? `mailto:${profile.email}` : undefined,
          address: profile.location || undefined,
          sameAs: links.filter((l) => l.url.startsWith("http")).map((l) => l.url),
        }}
      />
      <Hero profile={profile} links={links} />
      <FeaturedWork projects={projects} />
      <ExperienceTimeline items={experience} />
      <EducationList items={education} />
      <SkillsGrid groups={skills} />
      {settings.blogEnabled && <LatestWriting posts={posts.items} />}
      <ContactSection profile={profile} settings={settings} links={links} />
    </>
  );
}
