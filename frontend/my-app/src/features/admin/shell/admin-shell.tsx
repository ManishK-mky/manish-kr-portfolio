'use client';

import {
  BookOpen,
  Briefcase,
  Building2,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Images,
  LayoutDashboard,
  Link2,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  Tags,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '../auth/auth-provider';
import { Spinner } from '../components/page-header';

const NAV = [
  {
    group: 'Content',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/profile', label: 'Profile & hero', icon: UserRound },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/experience', label: 'Experience', icon: Briefcase },
      { href: '/admin/companies', label: 'Companies', icon: Building2 },
      { href: '/admin/education', label: 'Education', icon: GraduationCap },
      { href: '/admin/skills', label: 'Skills', icon: Sparkles },
    ],
  },
  {
    group: 'Blog',
    items: [
      { href: '/admin/blog', label: 'Posts', icon: BookOpen },
      { href: '/admin/blog/taxonomy', label: 'Categories & tags', icon: Tags },
    ],
  },
  {
    group: 'Site',
    items: [
      { href: '/admin/media', label: 'Media library', icon: Images },
      { href: '/admin/social-links', label: 'Social links', icon: Link2 },
      { href: '/admin/messages', label: 'Messages', icon: Mail },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/blog') return pathname === '/admin/blog' || /^\/admin\/blog\/(new|[a-f0-9]{24})/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {NAV.map((section) => (
        <div key={section.group}>
          <p className="mb-2 px-3 text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
            {section.group}
          </p>
          <ul className="space-y-0.5">
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                      active && 'bg-accent font-medium text-foreground',
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Checking session">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="mb-8 flex items-center gap-2 px-3 font-semibold tracking-tight">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs text-background">
          CMS
        </span>
        Portfolio admin
      </Link>
      <div className="flex-1 overflow-y-auto">
        <NavList onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="mt-6 space-y-1 border-t pt-4">
        <p className="truncate px-3 text-xs text-muted-foreground" title={user?.email}>
          {user?.email}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={async () => {
            await logout();
            router.replace('/admin/login');
          }}
        >
          <LogOut data-icon="inline-start" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-subtle">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-background p-4 lg:block">{sidebar}</aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-4">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <div className="flex-1" />
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View site <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
