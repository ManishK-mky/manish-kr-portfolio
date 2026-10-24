import { describe, expect, it } from "vitest";
import { safeNext } from "@/features/admin/auth/login-form";
import { contactSchema } from "@/features/contact/contact-schema";
import { postSchema } from "@/features/admin/pages/blog-editor";
import { projectSchema } from "@/features/admin/pages/project-editor";
import { experienceSchema } from "@/features/admin/pages/experience";
import { serverApiUrl } from "./api/config";
import { isKnownTag } from "./api/tags";
import cloudinaryLoader from "./cloudinary-loader";
import { formatRange, paragraphs, slugify } from "./format";
import { fieldErrors } from "./validation";

describe("serverApiUrl", () => {
  const KEYS = ["API_INTERNAL_URL", "API_SERVICE_URL", "NEXT_PUBLIC_API_URL", "NEXT_PHASE", "VERCEL_PROJECT_PRODUCTION_URL"];
  const withEnv = (env: Record<string, string>, fn: () => void) => {
    const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
    KEYS.forEach((k) => delete process.env[k]);
    Object.assign(process.env, env);
    try {
      fn();
    } finally {
      KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
    }
  };

  it("defaults to the local API", () =>
    withEnv({}, () => expect(serverApiUrl()).toBe("http://localhost:4000/api/v1")));

  it("uses the Vercel service binding at runtime, adding the API prefix", () =>
    withEnv({ API_SERVICE_URL: "https://api.internal.vercel/" }, () =>
      expect(serverApiUrl()).toBe("https://api.internal.vercel/api/v1"),
    ));

  it("uses the production deployment during builds, when bindings don't resolve", () =>
    withEnv(
      { API_SERVICE_URL: "https://api.internal.vercel", NEXT_PHASE: "phase-production-build", VERCEL_PROJECT_PRODUCTION_URL: "manish.dev" },
      () => expect(serverApiUrl()).toBe("https://manish.dev/api/v1"),
    ));

  it("lets an explicit API_INTERNAL_URL override everything", () =>
    withEnv({ API_INTERNAL_URL: "http://127.0.0.1:4000/api/v1/", API_SERVICE_URL: "https://x" }, () =>
      expect(serverApiUrl()).toBe("http://127.0.0.1:4000/api/v1"),
    ));
});

describe("cloudinaryLoader", () => {
  it("injects width, format and quality transformations", () => {
    expect(
      cloudinaryLoader({ src: "https://res.cloudinary.com/demo/image/upload/v1/portfolio/a.jpg", width: 640 }),
    ).toBe("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640,c_limit/v1/portfolio/a.jpg");
  });
  it("leaves other hosts untouched", () => {
    expect(cloudinaryLoader({ src: "https://example.com/a.jpg", width: 640 })).toBe("https://example.com/a.jpg");
  });
});

describe("format helpers", () => {
  it("formats ranges, including current roles", () => {
    expect(formatRange("2021-06-01", "2023-02-28")).toBe("Jun 2021 — Feb 2023");
    expect(formatRange("2023-03-01", null, true)).toBe("Mar 2023 — Present");
    expect(formatRange(null, null)).toBe("");
  });
  it("slugifies titles", () => {
    expect(slugify("Typed API clients — with Nest & Next!")).toBe("typed-api-clients-with-nest-and-next");
  });
  it("splits paragraphs on blank lines", () => {
    expect(paragraphs("One.\n\nTwo.\n  \nThree.")).toEqual(["One.", "Two.", "Three."]);
  });
});

describe("revalidation tags", () => {
  it.each([
    ["projects", true],
    ["post:hello-world", true],
    ["project:a-b-c", true],
    ["post:../../etc", false],
    ["anything-else", false],
    [42, false],
  ])("%s → %s", (tag, ok) => {
    expect(isKnownTag(tag)).toBe(ok);
  });
});

describe("safeNext", () => {
  it("only allows admin-relative redirects", () => {
    expect(safeNext("/admin/blog")).toBe("/admin/blog");
    expect(safeNext("https://evil.example")).toBe("/admin");
    expect(safeNext("//evil.example/admin")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});

describe("form schemas", () => {
  it("validates the contact form", () => {
    const { errors } = fieldErrors(contactSchema, { name: "A", email: "nope", message: "short" });
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name"]);
    expect(
      fieldErrors(contactSchema, { name: "Jamie", email: "j@example.com", message: "Hello there, nice site!" }).data,
    ).not.toBeNull();
  });

  it("rejects bad project URLs, slugs and date order", () => {
    const { errors } = fieldErrors(projectSchema, {
      title: "X",
      slug: "Not A Slug",
      summary: "s",
      githubUrl: "javascript:alert(1)",
      liveUrl: "",
      startDate: "2024-05-01",
      endDate: "2024-01-01",
    });
    expect(errors.slug).toBeDefined();
    expect(errors.githubUrl).toBeDefined();
    expect(errors.endDate).toBeDefined();
    expect(errors.liveUrl).toBeUndefined();
  });

  it("allows a current position without an end date", () => {
    expect(
      fieldErrors(experienceSchema, { company: "c", title: "Engineer", startDate: "2022-01-01", endDate: "", current: true }).data,
    ).not.toBeNull();
  });

  it("limits SEO field lengths", () => {
    const { errors } = fieldErrors(postSchema, {
      title: "Post",
      slug: "",
      excerpt: "",
      seoTitle: "x".repeat(71),
      seoDescription: "",
      canonicalUrl: "",
    });
    expect(errors.seoTitle).toMatch(/70/);
  });
});
