import { Link, useLocation } from "wouter";
import { Film, Upload, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 mb-8 px-2">
        <Film className="h-6 w-6" />
        <span className="text-xl font-bold tracking-tight">VoxClip AI</span>
      </div>
      <nav className="flex flex-col gap-2">
        <Link href="/app">
          <Button
            variant={location === "/app" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
        </Link>
        <Link href="/videos">
          <Button
            variant={location === "/videos" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => setIsOpen(false)}
          >
            <Film className="h-4 w-4" />
            My Videos
          </Button>
        </Link>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card px-4 py-6">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl py-8 px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
