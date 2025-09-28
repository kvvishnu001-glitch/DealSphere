import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Simple Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This is a simple test page to verify the React application is working.
          </p>
          <Button 
            onClick={() => alert("React is working!")}
            className="w-full"
          >
            Test Button
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}