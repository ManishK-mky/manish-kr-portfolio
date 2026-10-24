import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Post, Project, SkillGroup } from "@/types/api";
import { Article } from "./blog/article";
import { PostRow } from "./blog/post-card";
import { ProjectCard } from "./portfolio/project-card";
import { SkillsGrid } from "./portfolio/skills-grid";
import { CloudImage } from "@/components/site/cloud-image";

const project: Project = {
  id: "p1",
  title: "Relay",
  slug: "relay",
  summary: "Collaborative API workspace",
  cover: null,
  technologies: ["Next.js", "NestJS", "MongoDB", "Redis", "Yjs", "Docker"],
  category: "Product",
  githubUrl: "",
  liveUrl: "",
  role: "",
  achievements: [],
  featured: true,
  published: true,
  order: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const post: Post = {
  id: "b1",
  title: "Designing calm interfaces",
  slug: "designing-calm-interfaces",
  excerpt: "Notes on restraint",
  coverImage: null,
  readingTime: 4,
  wordCount: 800,
  author: { name: "Alex", avatarUrl: "" },
  category: { id: "c1", name: "Design", slug: "design" },
  tags: [{ id: "t1", name: "UX", slug: "ux" }],
  status: "published",
  publishedAt: "2024-03-05T00:00:00Z",
  featured: false,
  seo: { title: "", description: "", canonicalUrl: "" },
  createdAt: "2024-03-01T00:00:00Z",
  updatedAt: "2024-03-01T00:00:00Z",
  html: '<h2 id="start">Start</h2><p>Body text</p><h2 id="end">End</h2>',
  toc: [
    { id: "start", text: "Start", level: 2 },
    { id: "end", text: "End", level: 2 },
  ],
};

describe("public rendering", () => {
  it("renders a project card with a link and a capped tech list", () => {
    render(<ProjectCard project={project} />);
    expect(screen.getByRole("link", { name: "Relay" })).toHaveAttribute("href", "/projects/relay");
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders a post row with date, reading time and category", () => {
    render(<PostRow post={post} />);
    expect(screen.getByRole("link", { name: post.title })).toHaveAttribute("href", "/blog/designing-calm-interfaces");
    expect(screen.getByText("4 min read")).toBeInTheDocument();
    expect(screen.getByText("March 5, 2024")).toBeInTheDocument();
  });

  it("renders the article body, tags and table of contents", () => {
    render(<Article post={post} />);
    expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
    const toc = screen.getByRole("navigation", { name: "Table of contents" });
    expect(toc).toHaveTextContent("Start");
    expect(screen.getByRole("link", { name: "#UX" })).toHaveAttribute("href", "/blog?tag=ux");
  });

  it("marks featured skills for assistive tech and omits empty sections", () => {
    const groups: SkillGroup[] = [
      {
        id: "g1",
        name: "Frontend",
        slug: "frontend",
        description: "",
        order: 0,
        skills: [
          { id: "s1", name: "React", category: "g1", icon: "", proficiency: "Expert", featured: true, order: 0 },
          { id: "s2", name: "Vue", category: "g1", icon: "", proficiency: null, featured: false, order: 1 },
        ],
      },
    ];
    const { container, rerender } = render(<SkillsGrid groups={groups} />);
    expect(screen.getByText("(core skill)")).toBeInTheDocument();
    expect(screen.getByText("Expert")).toBeInTheDocument();
    rerender(<SkillsGrid groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an accessible placeholder when an image is missing", () => {
    render(<CloudImage image={null} label="Alex Morgan" sizes="100px" />);
    expect(screen.getByRole("img", { name: "Alex Morgan" })).toHaveTextContent("AM");
  });
});
