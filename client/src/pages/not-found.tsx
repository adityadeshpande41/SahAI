import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-lg border border-gray-200">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto shadow-md">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
          <p className="text-sm text-gray-600">
            The page you're looking for doesn't exist. Let's get you back home.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home" className="bg-blue-600 hover:bg-blue-700">
              <Home className="w-4 h-4 mr-1" /> Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
