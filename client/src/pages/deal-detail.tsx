import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function DealDetail() {
  const [, params] = useRoute("/deals/:id");
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Deal Details</h1>
              <p className="text-gray-600 mb-6">
                Deal ID: {params?.id}
              </p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}