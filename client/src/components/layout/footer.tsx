import { Link } from "wouter";
import { Percent } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <Percent className="text-red-500 w-5 h-5" />
              <span className="text-lg font-bold">DealSphere</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              AI-verified deals and coupons updated daily to help you find great savings.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-conditions" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/affiliate-disclosure" className="text-gray-400 hover:text-white transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-3">Disclosure</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              As an Amazon Associate, we earn from qualifying purchases. Prices and availability are subject to change.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} DealSphere. All rights reserved.
          </p>
          <p className="text-[10px] text-gray-600">
            Prices shown may differ from actual retailer pricing.
          </p>
        </div>
      </div>
    </footer>
  );
}
