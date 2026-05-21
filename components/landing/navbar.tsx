"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">ViralForge AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
            Demo
          </Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="gradient" size="sm">Get Started</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
