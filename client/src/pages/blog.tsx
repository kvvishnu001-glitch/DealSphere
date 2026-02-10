import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Percent,
  ChevronRight,
  Clock,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  ShoppingCart,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";

const guides = [
  {
    id: "how-to-find-best-deals",
    title: "How to Find the Best Online Deals in 2025",
    excerpt: "Learn proven strategies for finding genuine discounts, comparing prices across retailers, and using AI-powered tools to maximize your savings on every purchase.",
    category: "Shopping Tips",
    icon: ShoppingCart,
    readTime: "5 min read",
    date: "January 15, 2025",
    content: [
      { heading: "Use Price Comparison Tools", text: "Before making any purchase, compare prices across multiple retailers. Tools like DealSphere aggregate deals from dozens of stores, making it easy to find the lowest price." },
      { heading: "Look for AI-Verified Deals", text: "AI-powered deal platforms can detect fake discounts and inflated original prices. Only trust deals that have been verified by reliable systems." },
      { heading: "Time Your Purchases", text: "Major retailers run predictable sales cycles. Electronics are cheapest during Black Friday, fashion during end-of-season sales, and home goods during holiday weekends." },
      { heading: "Stack Coupons and Cashback", text: "Combine store coupons with cashback programs for maximum savings. Many deals can be stacked with credit card rewards for additional discounts." },
      { heading: "Set Price Alerts", text: "For big-ticket items, set price alerts and wait for drops. Prices on electronics and appliances can fluctuate significantly over weeks." }
    ]
  },
  {
    id: "ai-deal-verification",
    title: "How AI Verifies Deals: Behind the Technology",
    excerpt: "Discover how artificial intelligence analyzes, scores, and validates online deals to ensure they offer genuine savings. Understanding the technology behind smart shopping.",
    category: "Technology",
    icon: ShieldCheck,
    readTime: "4 min read",
    date: "January 10, 2025",
    content: [
      { heading: "Natural Language Processing", text: "AI systems analyze deal descriptions to verify claims about discounts, product features, and pricing accuracy." },
      { heading: "Price History Analysis", text: "By comparing current prices against historical data, AI can detect artificially inflated 'original prices' designed to make discounts seem larger." },
      { heading: "Quality Scoring", text: "Each deal receives a quality score based on factors like discount percentage, store reputation, product reviews, and deal freshness." },
      { heading: "Fraud Detection", text: "Machine learning models identify patterns common in fraudulent or misleading deals, filtering them before they reach consumers." }
    ]
  },
  {
    id: "coupon-strategies",
    title: "Coupon Strategies That Actually Work",
    excerpt: "Master the art of couponing with modern digital strategies. From browser extensions to loyalty programs, learn how to save 20-50% on everyday purchases.",
    category: "Money Saving",
    icon: DollarSign,
    readTime: "6 min read",
    date: "January 5, 2025",
    content: [
      { heading: "Digital Coupon Aggregators", text: "Sites like DealSphere collect and verify coupon codes from hundreds of stores. Always check for available codes before completing checkout." },
      { heading: "Store Loyalty Programs", text: "Most major retailers offer loyalty programs with exclusive discounts. Sign up for free programs at stores you shop at regularly." },
      { heading: "Browser Extensions", text: "Install coupon-finding browser extensions that automatically apply the best available codes at checkout." },
      { heading: "Email Signup Discounts", text: "Many stores offer 10-20% off your first purchase when you sign up for their newsletter. Use a dedicated email to manage these subscriptions." },
      { heading: "Seasonal Timing", text: "The best coupon deals appear during major shopping events: Black Friday, Cyber Monday, Prime Day, and end-of-season clearances." }
    ]
  },
  {
    id: "online-shopping-safety",
    title: "Online Shopping Safety: Avoiding Scams and Fake Deals",
    excerpt: "Protect yourself from online shopping scams with these essential safety tips. Learn to identify legitimate deals, secure payment practices, and red flags to watch for.",
    category: "Safety",
    icon: ShieldCheck,
    readTime: "5 min read",
    date: "December 28, 2024",
    content: [
      { heading: "Verify the Retailer", text: "Always shop from known, reputable retailers. Check for HTTPS in the URL, look for contact information, and read reviews before purchasing from unfamiliar stores." },
      { heading: "Too Good to Be True", text: "If a deal seems impossibly good, it probably is. Discounts of 90% or more on brand-name products are often indicators of counterfeit goods or scams." },
      { heading: "Use Secure Payment Methods", text: "Always use credit cards or secure payment services for online purchases. They offer better fraud protection than debit cards or wire transfers." },
      { heading: "Check Return Policies", text: "Before purchasing, review the store's return policy. Legitimate retailers have clear, reasonable return policies." }
    ]
  },
  {
    id: "best-deal-categories",
    title: "Top Deal Categories: Where to Find the Biggest Discounts",
    excerpt: "A comprehensive guide to the best deal categories including electronics, fashion, home goods, and more. Learn which categories offer the deepest discounts throughout the year.",
    category: "Shopping Guide",
    icon: TrendingUp,
    readTime: "7 min read",
    date: "December 20, 2024",
    content: [
      { heading: "Electronics & Tech", text: "Electronics see the biggest discounts during Black Friday, Prime Day, and back-to-school season. Look for open-box deals and refurbished items for additional savings." },
      { heading: "Fashion & Apparel", text: "Fashion deals peak during end-of-season clearances (January and July). Fast fashion brands often offer 40-60% off during these periods." },
      { heading: "Home & Garden", text: "Home improvement deals are best during Memorial Day, Labor Day, and Black Friday. Furniture sees deep discounts during Presidents' Day sales." },
      { heading: "Health & Beauty", text: "Beauty products often have buy-one-get-one deals and gift-with-purchase offers. Subscribe-and-save programs can reduce costs by 15-20%." },
      { heading: "Travel", text: "Flight and hotel deals are best booked 6-8 weeks in advance for domestic travel. Use fare comparison tools and be flexible with dates for maximum savings." }
    ]
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
              Expert guides to help you find the best deals, avoid scams, and save more money on every purchase.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <article key={guide.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                    <time className="text-xs text-gray-400">{guide.date}</time>

                    <div className="mt-6 space-y-4">
                      {guide.content.map((section, idx) => (
                        <div key={idx}>
                          <h3 className="font-semibold text-gray-900 mb-1">{section.heading}</h3>
                          <p className="text-sm text-gray-600">{section.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
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
              <div className="flex space-x-6">
                <Facebook className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
                <Instagram className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
                <Youtube className="w-5 h-5 hover:text-red-600 cursor-pointer transition-colors" />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-conditions" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="text-gray-400 text-xs">© 2025 DealSphere. All rights reserved.</div>
              <p className="text-[10px] text-gray-500 max-w-[200px]">We may earn a commission on qualifying purchases.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
