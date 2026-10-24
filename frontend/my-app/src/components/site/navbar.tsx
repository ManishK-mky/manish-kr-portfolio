'use client';

import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, type NavItem } from './nav-links';
import { ThemeToggle } from './theme-toggle';

/** Tracks which home-page section is in view. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState('top');
  useEffect(() => {
    if (!enabled) return;
    const ids = NAV_ITEMS.map((i) => i.section).filter(Boolean) as string[];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

interface NavbarProps {
  name: string;
  availability: React.ReactNode;
}

/** Reads the current path; must be rendered inside <Suspense> (see SiteLayout). */
export function Navbar(props: NavbarProps) {
  return <NavbarView {...props} pathname={usePathname()} />;
}

/** Static fallback for the prerendered shell: full navigation, no active state. */
export function NavbarFallback(props: NavbarProps) {
  return <NavbarView {...props} pathname={null} />;
}

function NavbarView({ name, availability, pathname }: NavbarProps & { pathname: string | null }) {
  const onHome = pathname === '/';
  const activeSection = useActiveSection(onHome);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation (state adjusted during render, not in an effect).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }
  // Lock background scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (item: NavItem) => {
    if (onHome) return item.section ? activeSection === item.section : false;
    if (!pathname || item.href === '/' || item.href.startsWith('/#')) return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300',
        (scrolled || open) && 'border-border/70 bg-background/80 backdrop-blur-md',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs text-background transition-transform group-hover:-rotate-6">
            {name
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join('')}
          </span>
          <span className="max-sm:sr-only">{name}</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground',
                    active && 'text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-accent"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                    />
                  )}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex">{availability}</span>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-accent lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 4rem)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t bg-background lg:hidden"
          >
            <ul className="container-page flex flex-col py-6">
              {NAV_ITEMS.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item) ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between border-b py-4 text-2xl font-medium tracking-tight text-muted-foreground',
                      isActive(item) && 'text-foreground',
                    )}
                  >
                    {item.label}
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
              <li className="pt-6 sm:hidden">{availability}</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
