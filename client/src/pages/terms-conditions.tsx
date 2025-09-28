import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>These terms and conditions govern your use of our service.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}