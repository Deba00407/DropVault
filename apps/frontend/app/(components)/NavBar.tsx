"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/app/(utils)/auth";
import {
  House,
  UploadSimple,
  ChatCircle,
  Files,
  SignOut,
} from "@phosphor-icons/react";

const navItems = [
  { href: "/dashboard", label: "Upload", icon: UploadSimple },
  { href: "/chat", label: "Chat", icon: ChatCircle },
  { href: "/documents", label: "Documents", icon: Files },
];

const NavBar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/getting-started/sign-in";
  };

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 font-mono text-xs",
                isActive
                  ? "bg-[#EFE9D8] text-[#B54708]"
                  : "text-[#6E6856] hover:bg-[#EFE9D8] hover:text-[#B54708]"
              )}
            >
              <Icon className="h-4 w-4" weight={isActive ? "fill" : "duotone"} />
              {item.label}
            </Button>
          </Link>
        );
      })}

      <div className="ml-2 h-4 w-px bg-[#DBD5C6]" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="gap-1.5 font-mono text-xs text-[#6E6856] hover:bg-[#EFE9D8] hover:text-[#B54708]"
      >
        <SignOut className="h-4 w-4" weight="duotone" />
        Sign out
      </Button>
    </nav>
  );
};

export { NavBar };
