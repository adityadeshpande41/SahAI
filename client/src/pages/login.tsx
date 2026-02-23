import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // For demo purposes, accept any credentials
      // In production, this would call a real auth API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log("Login successful:", data);
        
        // Store user ID in localStorage
        localStorage.setItem("sahai-user-id", data.userId);
        localStorage.setItem("sahai-authenticated", "true");
        
        // Force a small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        // Redirect to dashboard
        setLocation("/");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Quick demo login
    localStorage.setItem("sahai-authenticated", "true");
    toast({
      title: "Demo mode",
      description: "Logged in as demo user",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">SahAI</h1>
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your health copilot</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Continue as Demo User
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setLocation("/register")}
            >
              Sign up
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
