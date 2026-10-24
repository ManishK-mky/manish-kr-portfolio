import type { TiptapNode } from '../blog/rendering/tiptap-renderer.js';

/**
 * Initial content for Manish Kumar's portfolio, loaded by `npm run seed`.
 * Drawn from github.com/ManishK-mky (profile README, repositories and their
 * code). Everything is editable from the admin dashboard afterwards.
 *
 * Not included because it isn't publicly available: education, detailed
 * Appinventiv responsibilities and LinkedIn articles — add them in /admin.
 */

export const sampleProfile = {
  name: 'Manish Kumar',
  role: 'Software Engineer',
  greeting: 'Hi, I’m Manish — a software engineer at Appinventiv.',
  headline: 'Building thoughtful digital experiences through code and design.',
  intro:
    'Software engineer with 2+ years of experience building web applications with React, Next.js, Node.js and MongoDB. I enjoy turning ideas into fast, usable products — from the database to the interface.',
  bio: 'I’m a software engineer at Appinventiv, where I’ve spent the last two years building web applications for clients.\n\nI work across the stack — React and Next.js on the frontend, Node.js, Express and NestJS on the backend, with MongoDB underneath — and I care about UI/UX as much as the code behind it.\n\nOutside of work I build things to learn: real-time chat apps on WebSockets, a 3D virtual mall with A-Frame, an HTTP server in C++, and interactive guides to Git and TanStack Query that other developers can learn from.',
  location: 'India',
  email: 'mkydv38567@gmail.com',
  availability: { status: 'open', label: 'Open to new opportunities', visible: true },
  stats: [
    { value: '2+', label: 'Years as a software engineer' },
    { value: '45+', label: 'Public repositories' },
    { value: '13', label: 'Live project demos' },
  ],
} as const;

export const sampleSettings = {
  siteName: 'Manish Kumar',
  siteTitle: 'Manish Kumar — Software Engineer',
  siteDescription:
    'Portfolio of Manish Kumar, a software engineer at Appinventiv building web applications with React, Next.js, Node.js and MongoDB.',
  // Empty: the frontend then uses NEXT_PUBLIC_SITE_URL / the Vercel production domain.
  siteUrl: '',
  keywords: ['Manish Kumar', 'software engineer', 'MERN', 'React', 'Next.js', 'Node.js', 'portfolio'],
  footerTagline: 'Software engineer building fast, thoughtful web applications.',
  contactHeadline: 'Have a project or a role in mind? Let’s talk.',
  contactText:
    'I’m open to new opportunities and interesting collaborations. Email is the quickest way to reach me — or use the form and I’ll get back to you.',
  contactFormEnabled: true,
  blogEnabled: true,
};

export const sampleSocialLinks = [
  { platform: 'github', label: 'GitHub', url: 'https://github.com/ManishK-mky', showInHero: true },
  { platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/manish-kumar-a4641620b', showInHero: true },
  { platform: 'other', label: 'LeetCode', url: 'https://leetcode.com/12known182002', showInHero: false },
  { platform: 'email', label: 'Email', url: 'mailto:mkydv38567@gmail.com', showInHero: false },
] as const;

// Skills evidenced by the GitHub repositories. Proficiency labels are left for
// Manish to set in the admin rather than guessed here.
export const sampleSkills: Record<string, { name: string; icon?: string; proficiency?: string; featured?: boolean }[]> = {
  'Programming Languages': [
    { name: 'JavaScript', icon: 'javascript', featured: true },
    { name: 'TypeScript', icon: 'typescript', featured: true },
    { name: 'C++', icon: 'cpp' },
    { name: 'Python', icon: 'python' },
  ],
  'Frontend Development': [
    { name: 'React', icon: 'react', featured: true },
    { name: 'Next.js', icon: 'nextjs', featured: true },
    { name: 'HTML & CSS', icon: 'html' },
    { name: 'Tailwind CSS', icon: 'tailwind' },
  ],
  'Backend Development': [
    { name: 'Node.js', icon: 'nodejs', featured: true },
    { name: 'Express.js', icon: 'express', featured: true },
    { name: 'NestJS', icon: 'nestjs' },
    { name: 'WebSockets & Socket.io', icon: 'api' },
    { name: 'JWT authentication', icon: 'lock' },
  ],
  Databases: [
    { name: 'MongoDB', icon: 'mongodb', featured: true },
    { name: 'Mongoose', icon: 'database' },
  ],
  'Frameworks and Libraries': [
    { name: 'Redux Toolkit', icon: 'redux' },
    { name: 'TanStack Query', icon: 'react' },
    { name: 'Zustand', icon: 'react' },
    { name: 'Material UI', icon: 'mui' },
    { name: 'Formik, Yup & Zod', icon: 'form' },
    { name: 'A-Frame (WebXR)', icon: 'vr' },
  ],
  'Cloud and DevOps': [
    { name: 'Vercel', icon: 'vercel' },
  ],
  'Tools and Platforms': [
    { name: 'Git', icon: 'git' },
    { name: 'GitHub', icon: 'github' },
    { name: 'GitLab', icon: 'gitlab' },
    { name: 'Vite', icon: 'vite' },
    { name: 'Stripe', icon: 'payment' },
  ],
  'Design and Collaboration': [
    { name: 'UI/UX design', icon: 'palette' },
  ],
};

export const sampleCompanies = [
  {
    name: 'Appinventiv',
    website: 'https://appinventiv.com',
    location: 'Noida, India',
    industry: 'Software development & digital transformation',
    description: 'A global digital product development company building mobile and web applications.',
  },
] as const;

// About 2.2 years at Appinventiv as of October 2026. The start date is
// approximate — set the exact month in /admin/experience.
export const sampleExperience = [
  {
    company: 'Appinventiv',
    title: 'Software Engineer',
    employmentType: 'full-time',
    location: 'India',
    workMode: 'onsite',
    startDate: '2024-08-01',
    current: true,
    summary: 'Building web applications for Appinventiv’s clients across the JavaScript stack.',
    responsibilities: [],
    achievements: [],
    technologies: ['React', 'Next.js', 'TypeScript', 'Node.js', 'MongoDB'],
  },
] as const;

/** Not public — add your degree(s) in /admin/education. */
export const sampleEducation: {
  institution: string;
  website: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
  coursework: readonly string[];
  achievements: readonly string[];
  activities: readonly string[];
  description: string;
}[] = [];

export const sampleProjects = [
  {
    title: 'TanStack Guide',
    summary:
      'A beginner-friendly, interactive guide to TanStack Query — queries, mutations, pagination, caching, error handling and DevTools — with runnable examples.',
    description:
      'TanStack Guide is a structured walkthrough of TanStack Query for developers who are new to it, and a quick reference for those who aren’t.\n\nEach topic — basic queries, mutations, pagination, cache management, error handling and the DevTools — has its own page with a live example against a real API and syntax-highlighted code, plus side-by-side comparisons that show why each pattern matters.',
    technologies: ['React', 'TypeScript', 'TanStack Query', 'Zustand', 'React Router', 'Tailwind CSS', 'Vite'],
    category: 'Developer education',
    githubUrl: 'https://github.com/ManishK-mky/tanstack-guide',
    liveUrl: 'https://tanstack-guide.vercel.app',
    role: 'Designer & developer',
    responsibilities: ['Content and information architecture', 'Interactive examples', 'Theming and layout'],
    challenges: [],
    features: [
      'Dedicated pages for queries, mutations, pagination, caching and error handling',
      'Live examples with React Query DevTools',
      'Syntax-highlighted code blocks and comparison views',
      'Light and dark themes',
    ],
    achievements: [],
    featured: true,
  },
  {
    title: 'Git Learn',
    summary:
      'An interactive Git reference: commands with examples and diagrams, the file lifecycle, command comparisons and best practices.',
    description:
      'Git Learn makes Git approachable. It catalogues everyday commands with explanations, examples and diagrams, visualises how files move through the Git lifecycle, compares commands that are easy to confuse, and collects best practices in one place.',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    category: 'Developer education',
    githubUrl: 'https://github.com/ManishK-mky/Git-Learn',
    liveUrl: 'https://git-learn-tawny.vercel.app',
    role: 'Designer & developer',
    responsibilities: [],
    challenges: [],
    features: ['Searchable command list', 'Command diagrams and examples', 'Git lifecycle visualisation', 'Comparison table', 'Best practices'],
    achievements: [],
    featured: true,
  },
  {
    title: 'Rentify',
    summary:
      'A full-stack MERN marketplace with JWT authentication, role-based routes and an admin dashboard for managing categories, products and users.',
    description:
      'Rentify is a MERN application with separate user and admin experiences. Users register, log in and browse listings; admins manage categories, create and update products and review users from a dashboard.\n\nThe Express API uses JWT authentication with bcrypt-hashed passwords, Mongoose models and slug-based URLs, and the React client protects private and admin routes.',
    technologies: ['React', 'Material UI', 'Node.js', 'Express.js', 'MongoDB', 'Mongoose', 'JWT'],
    category: 'Full-stack',
    githubUrl: 'https://github.com/ManishK-mky/presidio_rentify',
    liveUrl: 'https://presidio-rentify-eight.vercel.app',
    role: 'Full-stack developer',
    responsibilities: ['REST API and data models', 'Authentication and authorisation', 'Admin dashboard'],
    challenges: [],
    features: ['Register, login and password reset', 'Private and admin-only routes', 'Category and product management', 'User management'],
    achievements: [],
    featured: true,
  },
  {
    title: 'AR/VR Mall',
    summary:
      'A multiplayer 3D virtual shopping mall in the browser, built with A-Frame and Networked-Aframe, with accounts and Stripe payments.',
    description:
      'AR/VR Mall explores shopping in a shared 3D space. Visitors explore a virtual city and storefronts with avatars in the browser, see each other in real time through Networked-Aframe, and check out with Stripe. An Express and MongoDB backend handles accounts and data.',
    technologies: ['A-Frame', 'Networked-Aframe', 'Node.js', 'Express.js', 'MongoDB', 'EJS', 'Stripe'],
    category: 'WebXR',
    githubUrl: 'https://github.com/ManishK-mky/AR-VR-Mall',
    liveUrl: '',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: ['3D scenes and avatars', 'Real-time multiplayer presence', 'Login and accounts', 'Stripe checkout'],
    achievements: [],
    featured: true,
  },
  {
    title: 'Realtime Chat',
    summary:
      'A real-time chat room with typing indicators and notification sounds, built on Socket.io and Express.',
    description:
      'A lightweight chat application where messages arrive instantly over Socket.io. It shows who is typing, plays a sound for incoming messages and works across screen sizes.',
    technologies: ['Node.js', 'Express.js', 'Socket.io', 'JavaScript'],
    category: 'Real-time',
    githubUrl: 'https://github.com/ManishK-mky/socket_chat',
    liveUrl: 'https://socket-chat-khaki.vercel.app',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: ['Real-time messaging', 'Typing indicator', 'Notification sounds', 'Responsive UI'],
    achievements: [],
    featured: false,
  },
  {
    title: 'Web-ka-Socket',
    summary: 'A React chat client talking to an Express server over native WebSockets (ws), without Socket.io.',
    description:
      'Built to understand WebSockets at a lower level: an Express server using the ws library and a React chat screen that connects to it directly.',
    technologies: ['React', 'Node.js', 'Express.js', 'WebSockets (ws)'],
    category: 'Real-time',
    githubUrl: 'https://github.com/ManishK-mky/web-ka-socket',
    liveUrl: 'https://web-ka-socket.vercel.app',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: [],
    achievements: [],
    featured: false,
  },
  {
    title: 'Look — authentication flow',
    summary: 'A Next.js sign-up, login and OTP-verification flow with Redux Toolkit and schema-validated forms.',
    description:
      'An authentication module for a Next.js app: registration, login and one-time-password verification, with form state in Formik, validation with Yup and Zod, and API calls through an Axios instance managed by Redux Toolkit.',
    technologies: ['Next.js', 'TypeScript', 'Redux Toolkit', 'Formik', 'Zod', 'Tailwind CSS'],
    category: 'Frontend',
    githubUrl: 'https://github.com/ManishK-mky/look_app',
    liveUrl: '',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: ['Sign-up and login', 'OTP verification', 'Validated forms'],
    achievements: [],
    featured: false,
  },
  {
    title: 'E-commerce Store',
    summary: 'A shopping storefront with categories, product pages, related products and a cart managed with React Context.',
    description:
      'A storefront front end with category pages, product detail views, related products, offers and a cart, using React Context for shared shop state.',
    technologies: ['React', 'React Router', 'Tailwind CSS', 'Context API'],
    category: 'Frontend',
    githubUrl: 'https://github.com/ManishK-mky/E-commerce-Mern-',
    liveUrl: 'https://e-commerce-mern-ruby.vercel.app',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: ['Category browsing', 'Product details', 'Cart', 'Login and sign-up pages'],
    achievements: [],
    featured: false,
  },
  {
    title: 'Organic Web',
    summary: 'An organic grocery storefront with product categories, a side cart, reviews and featured brands.',
    description:
      'A grocery shopping site with category pages (groceries, juices and more), trending and best-selling products, reviews, featured brands and a slide-out cart.',
    technologies: ['React', 'React Router', 'Tailwind CSS'],
    category: 'Frontend',
    githubUrl: 'https://github.com/ManishK-mky/organic_web',
    liveUrl: 'https://organic-web-eight.vercel.app',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: [],
    achievements: [],
    featured: false,
  },
  {
    title: 'Gemini Clone',
    summary: 'A Gemini-style AI chat interface built with React and the Context API.',
    description: 'A recreation of the Gemini chat interface in React, using the Context API for global state.',
    technologies: ['React', 'Context API', 'Vite'],
    category: 'Frontend',
    githubUrl: 'https://github.com/ManishK-mky/Gemini_clone',
    liveUrl: 'https://gemini-clone-two-kappa.vercel.app',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: [],
    achievements: [],
    featured: false,
  },
  {
    title: 'HTTP Server in C++',
    summary: 'A minimal HTTP server written from scratch in C++ to understand sockets and the request/response cycle.',
    description:
      'A small HTTP server built directly on sockets in C++ — a way to learn what frameworks like Express do under the hood.',
    technologies: ['C++', 'Sockets', 'HTTP'],
    category: 'Systems',
    githubUrl: 'https://github.com/ManishK-mky/HTTP-server-in-C-',
    liveUrl: '',
    role: 'Developer',
    responsibilities: [],
    challenges: [],
    features: [],
    achievements: [],
    featured: false,
  },
] as const;

/**
 * Blog posts. LinkedIn articles couldn't be retrieved automatically (LinkedIn
 * blocks unauthenticated access), so none are seeded — paste them into the
 * blog editor at /admin/blog/new, or add them here in the same shape.
 */
export const samplePosts: {
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  content: TiptapNode;
}[] = [];
