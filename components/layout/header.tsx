"use client"

import Link from "next/link"
import { BotMessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes" // Assuming ThemeProvider is set up in layout
import { Moon, Sun, PlusCircle } from "lucide-react"

export function Header() {
  const { setTheme, theme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">MCP Server Directory</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-2 sm:space-x-4 sm:justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href="/submit">
              <PlusCircle className="h-4 w-4 mr-2" />
              Submit Server
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
