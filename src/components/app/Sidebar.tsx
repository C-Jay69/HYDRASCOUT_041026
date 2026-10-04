"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  List,
  Mail,
  BarChart3,
  Bookmark,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Users,
  UserSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Launch Automation", href: "/automation/launch", icon: Rocket },
  { title: "Lead CRM", href: "/leads", icon: Users },
  { title: "Property Search", href: "/search", icon: Map },
  { title: "Skip Trace", href: "/skip-trace", icon: UserSearch },
  { title: "Lead Lists", href: "/lists", icon: List },
  { title: "Campaigns", href: "/campaigns", icon: Mail },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Saved Searches", href: "/alerts", icon: Bookmark },
  { title: "Billing", href: "/billing", icon: CreditCard },
];

interface SidebarProps {
  defaultCollapsed?: boolean;
  className?: string;
}

export function Sidebar({ defaultCollapsed = false, className }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useMobile();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // On mobile, sidebar is always shown via Sheet
  const showCollapsed = !isMobile && isCollapsed;

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r transition-all duration-300",
        showCollapsed ? "w-16" : "w-[280px]",
        className
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                    isActive
                      ? "bg-[#1a56db]/10 text-[#1a56db]"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#1a56db] rounded-r" />
                  )}
                  <Icon className={cn("h-5 w-5 flex-shrink-0", showCollapsed && "mx-auto")} />
                  {!showCollapsed && (
                    <span className="text-sm font-medium">{item.title}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle - Desktop only */}
      {!isMobile && (
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {showCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}

// Mobile navigation component
export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const mobileNavItems = [
    { title: "Search", href: "/search", icon: Map },
    { title: "Lists", href: "/lists", icon: List },
    { title: "Campaigns", href: "/campaigns", icon: Mail },
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
    { title: "More", href: "/more", icon: LayoutDashboard },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
