import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function AffiliateDisclosure() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-red-600">Home</Link></li>
          <li><ChevronRight className="w-4 h-4" /></li>
          <li className="text-gray-900 font-medium">Affiliate Disclosure</li>
        </ol>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Affiliate Disclosure</CardTitle>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">FTC Disclosure</h2>
              <p className="text-gray-700 leading-relaxed">
                DealSphere is a participant in affiliate marketing programs. This means that when you click on certain links on our website and make a purchase, we may receive a small commission at no additional cost to you. These commissions help us maintain and improve our platform so we can continue providing you with curated deals and shopping information.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">Amazon Associates Disclosure</h2>
              <p className="text-gray-700 leading-relaxed font-medium bg-amber-50 border border-amber-200 rounded-lg p-4">
                As an Amazon Associate, DealSphere earns from qualifying purchases. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or its affiliates.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                DealSphere is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">Other Affiliate Programs</h2>
              <p className="text-gray-700 leading-relaxed">
                In addition to Amazon Associates, DealSphere may participate in other affiliate programs including but not limited to Commission Junction (CJ), ShareASale, Rakuten, Impact, ClickBank, and other affiliate networks. We may earn commissions from purchases made through links to these partner websites.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">Pricing and Availability</h2>
              <p className="text-gray-700 leading-relaxed">
                Product prices and availability are accurate as of the date and time indicated on our website and are subject to change. Any price and availability information displayed on partner websites (including Amazon.com) at the time of purchase will apply to the purchase of the product. We make every effort to keep pricing information up to date, but we cannot guarantee that prices shown on our site will always match the current price at the retailer.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">Editorial Independence</h2>
              <p className="text-gray-700 leading-relaxed">
                Our affiliate relationships do not influence our editorial content. We feature deals based on their value to our users, as determined by our AI verification system. The presence of affiliate links does not affect the deals we choose to display or the order in which they appear.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">Your Support</h2>
              <p className="text-gray-700 leading-relaxed">
                When you use our affiliate links to make purchases, you support DealSphere at no extra cost to you. The price you pay is the same whether you use our link or go directly to the retailer's website. We appreciate your support, as it helps us continue to find and verify deals for our community.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">Questions?</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about our affiliate relationships or this disclosure, please <Link href="/contact" className="text-red-600 hover:text-red-700 underline">contact us</Link>.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deals
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
