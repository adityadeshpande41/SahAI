import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Brain, Shield, Users, MessageCircle, TrendingUp, Pill, UtensilsCrossed } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img 
              src="/SahAI.png" 
              alt="SahAI Logo" 
              className="w-16 h-16 object-contain"
            />
            <h1 className="text-5xl font-bold tracking-tight text-gradient">SahAI</h1>
          </div>
          <p className="text-2xl text-muted-foreground mb-4">Your Personal Health Copilot</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            An AI-powered health companion designed for seniors, helping you manage medications, 
            track meals, monitor symptoms, and stay connected with caregivers.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="card-elevated">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Medication Management</h3>
              <p className="text-sm text-muted-foreground">
                Track medications, get reminders, and upload prescriptions with AI-powered OCR
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Voice-First AI Chat</h3>
              <p className="text-sm text-muted-foreground">
                Talk naturally to your health copilot in your preferred language
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Routine Twin</h3>
              <p className="text-sm text-muted-foreground">
                AI learns your daily patterns and alerts you to unusual changes
              </p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Caregiver Connect</h3>
              <p className="text-sm text-muted-foreground">
                Keep family informed with privacy-controlled health summaries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose SahAI?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Privacy-First Design</h3>
                <p className="text-sm text-muted-foreground">
                  Your health data is encrypted and never shared without your permission
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Smart Insights</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered pattern detection helps identify health trends early
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <UtensilsCrossed className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Meal Photo Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Take a photo of your meal and get instant nutrition insights
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Designed for Seniors</h3>
                <p className="text-sm text-muted-foreground">
                  Large text, simple language, and voice-first interface
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of seniors who trust SahAI to help manage their health
              </p>
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
                Start Your Journey
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
