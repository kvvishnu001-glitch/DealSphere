import { Link } from "wouter";
import {
  Percent,
  ChevronRight,
  Shield,
  Zap,
  Brain,
  TrendingUp,
  Users,
  Target,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";

export default function About() {
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
              <Link href="/about" className="text-red-600 font-medium">About</Link>
              <Link href="/blog" className="text-gray-600 hover:text-red-600 transition-colors">Blog</Link>
              <Link href="/contact" className="text-gray-600 hover:text-red-600 transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-red-600">Home</Link></li>
          <li><ChevronRight className="w-4 h-4" /></li>
          <li className="text-gray-900 font-medium">About Us</li>
        </ol>
      </nav>

      <main className="flex-1">
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">About DealSphere</h1>
            <p className="text-lg sm:text-xl text-red-100 max-w-2xl mx-auto">
              We use artificial intelligence to find, verify, and curate the best deals and coupons from top online stores, saving you time and money.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              DealSphere was built with a simple goal: make online shopping smarter. Every day, thousands of deals appear across hundreds of stores, but finding genuine, high-value offers can be overwhelming. That's where we come in.
            </p>
            <p className="text-gray-700 leading-relaxed mb-8">
              Our AI-powered platform scans, validates, and categorizes deals from top retailers like Amazon, Walmart, Target, Best Buy, and many more. Each deal is scored for quality and verified before it reaches you, so you can shop with confidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <Brain className="w-10 h-10 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Verified Deals</h3>
                <p className="text-sm text-gray-600">
                  Every deal is analyzed and scored by our AI system to ensure it's genuine, in stock, and offers real savings.
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <Zap className="w-10 h-10 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Updated Daily</h3>
                <p className="text-sm text-gray-600">
                  Our system continuously monitors stores for new deals, price drops, and expiring offers so you never miss a savings opportunity.
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <Shield className="w-10 h-10 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted Sources</h3>
                <p className="text-sm text-gray-600">
                  We partner with established affiliate networks and retailers to bring you deals from brands you know and trust.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">How DealSphere Works</h2>
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Deal Aggregation</h3>
                  <p className="text-gray-600 text-sm">We aggregate deals from over a dozen major affiliate networks including Amazon Associates, Commission Junction, ShareASale, Rakuten, and more.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Validation</h3>
                  <p className="text-gray-600 text-sm">Each deal passes through our OpenAI-powered validation system, which checks for accuracy, relevance, and quality. Only deals scoring above our threshold are approved.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Categorization & Scoring</h3>
                  <p className="text-gray-600 text-sm">Approved deals are categorized by type (electronics, fashion, home, etc.) and scored to help you find the best offers quickly.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Easy Redemption</h3>
                  <p className="text-gray-600 text-sm">Click any deal to go directly to the store's page with the discount applied. Some deals include coupon codes that are automatically displayed for you.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-8">
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">Is DealSphere free to use?</summary>
                <p className="mt-3 text-sm text-gray-600">Yes, DealSphere is completely free for shoppers. We earn a small commission from affiliate networks when you purchase through our links, at no extra cost to you.</p>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">How often are deals updated?</summary>
                <p className="mt-3 text-sm text-gray-600">Our system checks for new deals multiple times per day. Deals are updated continuously to ensure pricing accuracy and availability.</p>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">What makes DealSphere different from other deal sites?</summary>
                <p className="mt-3 text-sm text-gray-600">Unlike traditional deal sites that rely on manual curation, DealSphere uses AI to validate every deal. This means fewer expired or misleading offers, and a higher quality selection of genuine discounts.</p>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">Which stores does DealSphere cover?</summary>
                <p className="mt-3 text-sm text-gray-600">We aggregate deals from major retailers including Amazon, Walmart, Target, Best Buy, Macy's, Nike, and hundreds more through our affiliate network partnerships.</p>
              </details>
            </div>
          </article>
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
