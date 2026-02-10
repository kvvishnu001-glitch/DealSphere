import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Percent,
  ChevronRight,
  Mail,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              <Link href="/blog" className="text-gray-600 hover:text-red-600 transition-colors">Blog</Link>
              <Link href="/contact" className="text-red-600 font-medium">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-red-600">Home</Link></li>
          <li><ChevronRight className="w-4 h-4" /></li>
          <li className="text-gray-900 font-medium">Contact</li>
        </ol>
      </nav>

      <main className="flex-1">
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Contact Us</h1>
            <p className="text-lg text-red-100">
              Have a question, suggestion, or partnership inquiry? We'd love to hear from you.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <Mail className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                <p className="text-sm text-gray-600">support@dealsphere.com</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <MessageSquare className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Partnerships</h3>
                <p className="text-sm text-gray-600">partners@dealsphere.com</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-4">
                <HelpCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">FAQ</h3>
                <p className="text-sm text-gray-600">
                  <Link href="/about" className="text-red-600 hover:underline">Visit our About page</Link>
                </p>
              </CardContent>
            </Card>
          </div>

          {submitted ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-600 mb-4">Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
                <Button onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }); }} className="bg-red-600 hover:bg-red-700">
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      id="message"
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={formData.message}
                      onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                      placeholder="Tell us more..."
                    />
                  </div>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-8">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
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
              <div className="text-gray-400 text-xs">© {new Date().getFullYear()} DealSphere. All rights reserved.</div>
              <p className="text-[10px] text-gray-500 max-w-[200px]">As an Amazon Associate, we earn from qualifying purchases.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
