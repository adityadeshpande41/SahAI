import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-xl bg-primary/15 dark:bg-primary/25 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist. Let's get you back home.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">
              <Home className="w-4 h-4 mr-1" /> Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
