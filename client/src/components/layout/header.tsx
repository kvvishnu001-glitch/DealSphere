import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Percent, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[68px]">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Percent className="text-red-600 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">DealSphere</span>
          </Link>

          {children && (
            <div className="flex-1 mx-3 sm:mx-6 lg:mx-10 max-w-xs sm:max-w-lg lg:max-w-xl hidden sm:block">
              {children}
            </div>
          )}

          <nav className="hidden md:flex items-center space-x-2 lg:space-x-6 text-sm lg:text-[15px]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 lg:px-3 py-1.5 rounded-md transition-colors ${
                  location === link.href
                    ? "text-red-600 font-semibold bg-red-50"
                    : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {children && (
          <div className="sm:hidden pb-3">
            {children}
          </div>
        )}
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  location === link.href
                    ? "text-red-600 bg-red-50"
                    : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
