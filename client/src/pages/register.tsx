import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    ageGroup: "",
    language: "English",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.password || !formData.name || !formData.ageGroup) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          ageGroup: formData.ageGroup,
          language: formData.language,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("sahai-user-id", data.userId);
        localStorage.setItem("sahai-authenticated", "true");
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        toast({
          title: "Welcome to SahAI!",
          description: "Your account has been created successfully.",
        });
        
        setLocation("/onboarding");
      } else {
        toast({
          title: "Registration failed",
          description: data.error || "Username might already be taken",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

      <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-gray-200 shadow-2xl">
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
            <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
            <p className="text-sm text-gray-600 mt-1">Join your personal health copilot</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                  className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageGroup" className="text-gray-700 font-medium">Age Group *</Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="ageGroup" className="h-11 rounded-xl border-gray-300">
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-24">18-24</SelectItem>
                    <SelectItem value="25-34">25-34</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55-64">55-64</SelectItem>
                    <SelectItem value="65-74">65-74</SelectItem>
                    <SelectItem value="75-84">75-84</SelectItem>
                    <SelectItem value="85+">85+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                  className="h-11 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-gray-700 font-medium">Preferred Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="language" className="h-11 rounded-xl border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="Mandarin">Mandarin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              onClick={() => setLocation("/login")}
            >
              Sign in
            </button>
          </p>

          <p className="text-xs text-center text-gray-500 pt-2">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
