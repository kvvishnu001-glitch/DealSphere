import { Link } from "wouter";
import {
  Percent,
  ChevronRight,
  Clock,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  ShoppingCart,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const guides = [
  {
    id: "how-to-find-best-deals",
    title: "How to Find the Best Online Deals in 2025",
    excerpt: "Learn proven strategies for finding genuine discounts, comparing prices across retailers, and using AI-powered tools to maximize your savings on every purchase.",
    category: "Shopping Tips",
    icon: ShoppingCart,
    readTime: "5 min read",
    date: "January 15, 2025",
  },
  {
    id: "ai-deal-verification",
    title: "How AI Verifies Deals: Behind the Technology",
    excerpt: "Discover how artificial intelligence analyzes, scores, and validates online deals to ensure they offer genuine savings. Understanding the technology behind smart shopping.",
    category: "Technology",
    icon: ShieldCheck,
    readTime: "4 min read",
    date: "January 10, 2025",
  },
  {
    id: "coupon-strategies",
    title: "Coupon Strategies That Actually Work",
    excerpt: "Master the art of couponing with modern digital strategies. From browser extensions to loyalty programs, learn how to save 20-50% on everyday purchases.",
    category: "Money Saving",
    icon: DollarSign,
    readTime: "6 min read",
    date: "January 5, 2025",
  },
  {
    id: "online-shopping-safety",
    title: "Online Shopping Safety: Avoiding Scams and Fake Deals",
    excerpt: "Protect yourself from online shopping scams with these essential safety tips. Learn to identify legitimate deals, secure payment practices, and red flags to watch for.",
    category: "Safety",
    icon: ShieldCheck,
    readTime: "5 min read",
    date: "December 28, 2024",
  },
  {
    id: "best-deal-categories",
    title: "Top Deal Categories: Where to Find the Biggest Discounts",
    excerpt: "A comprehensive guide to the top deal categories including electronics, fashion, home goods, and more. Learn which categories offer the deepest discounts throughout the year.",
    category: "Shopping Guide",
    icon: TrendingUp,
    readTime: "7 min read",
    date: "December 20, 2024",
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Percent className="text-red-600 w-6 h-6" />
              <span className="text-xl font-bold text-gray-900">DealSphere</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm">
              <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors">Home</Link>
              <Link href="/about" className="text-gray-600 hover:text-red-600 transition-colors">About</Link>
              <Link href="/blog" className="text-red-600 font-medium">Blog</Link>
              <Link href="/contact" className="text-gray-600 hover:text-red-600 transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-red-600">Home</Link></li>
          <li><ChevronRight className="w-4 h-4" /></li>
          <li className="text-gray-900 font-medium">Blog & Guides</li>
        </ol>
      </nav>

      <main className="flex-1">
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Deal Guides & Shopping Tips</h1>
            <p className="text-lg text-red-100">
              Expert guides to help you find great deals, avoid scams, and save more money on every purchase.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link key={guide.id} href={`/blog/${guide.id}`}>
                  <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-red-100 transition-all cursor-pointer">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <Icon className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-red-600 uppercase tracking-wider">{guide.category}</span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {guide.readTime}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{guide.title}</h2>
                      <p className="text-gray-600 mb-4">{guide.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <time className="text-xs text-gray-400">{guide.date}</time>
                        <span className="text-red-600 text-sm font-medium flex items-center gap-1">
                          Read More <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">More guides coming soon. Check back for updated shopping tips and deal strategies.</p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Percent className="text-red-600 text-xl mr-2" />
                <h3 className="text-lg font-bold">DealSphere</h3>
              </div>
              <p className="text-gray-400 text-xs max-w-xs">AI-verified deals and coupons updated daily.</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                <Link href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} DealSphere. All rights reserved.</div>
              <p className="text-[10px] text-gray-500 max-w-[200px]">As an Amazon Associate, we earn from qualifying purchases.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
