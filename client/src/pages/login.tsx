import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem("sahai-user-id", data.userId);
        localStorage.setItem("sahai-authenticated", "true");
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
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
    localStorage.setItem("sahai-authenticated", "true");
    toast({
      title: "Demo mode",
      description: "Logged in as demo user",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => setLocation("/landing")}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back</span>
      </button>

      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-gray-200 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SahAI
            </h1>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-600 mt-1">Sign in to your health copilot</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all" 
              disabled={isLoading}
            >
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500 font-medium">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-medium transition-all"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Continue as Demo User
          </Button>

          <p className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
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
