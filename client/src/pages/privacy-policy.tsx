import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}