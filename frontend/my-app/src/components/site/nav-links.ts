export interface NavItem {
  label: string;
  href: string;
  /** Section id on the home page, used for scroll-spy highlighting. */
  section?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', section: 'top' },
  { label: 'Projects', href: '/projects' },
  { label: 'Experience', href: '/#experience', section: 'experience' },
  { label: 'Education', href: '/#education', section: 'education' },
  { label: 'Skills', href: '/#skills', section: 'skills' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#contact', section: 'contact' },
];
