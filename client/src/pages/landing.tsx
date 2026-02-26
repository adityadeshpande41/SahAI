import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, Brain, Shield, Users, MessageCircle, TrendingUp, Pill, UtensilsCrossed,
  Sparkles, Camera, Globe, Zap, Clock, BarChart3, Bell, Lock
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <img 
              src="/SahAI.png" 
              alt="SahAI Logo" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-gradient mb-4">SahAI</h1>
          <p className="text-3xl md:text-4xl font-semibold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Your AI-Powered Health Companion
          </p>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Experience the future of health management with intelligent voice conversations, 
            personalized insights, and proactive care—designed for everyone who values their wellbeing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/register")} className="text-lg px-10 py-7">
              Learn More
            </Button>
          </div>
        </div>

        {/* AI-Powered Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Powered by Advanced AI</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our intelligent agents work together to provide personalized, proactive health support
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-elevated hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Routine Twin AI</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Learns your daily patterns and detects unusual changes before they become problems
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Voice-First Conversations</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Talk naturally in 20+ languages—AI understands context and remembers your preferences
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Smart Photo Analysis</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Snap a photo of your meal or prescription—AI extracts nutrition info and medication details
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Personalized Insights</h3>
                <p className="text-sm text-muted-foreground text-center">
                  AI analyzes your health data to provide tailored recommendations and early warnings
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Proactive Reminders</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Smart notifications for medications, meals, and activities—never miss what matters
                </p>
              </CardContent>
            </Card>

            <Card className="card-elevated hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-center">Family Connection</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Caregivers get real-time updates and AI-generated health summaries with full privacy control
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose SahAI */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-center mb-12">Why SahAI Stands Out</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <Globe className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Multilingual & Accessible</h3>
                <p className="text-sm text-muted-foreground">
                  Supports 20+ languages including Hindi, Marathi, Tamil, Telugu, and more. Built with accessibility-first design for all abilities.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <Lock className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Privacy-First Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  End-to-end encryption, HIPAA-compliant storage, and you control who sees your data—always.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <BarChart3 className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Predictive Health Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  AI identifies patterns and trends in your vitals, symptoms, and routines to catch issues early.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <Clock className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Works Offline</h3>
                <p className="text-sm text-muted-foreground">
                  Core features available without internet—your health companion is always there when you need it.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <Bell className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Intelligent Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Context-aware reminders that adapt to your schedule and habits—helpful, not annoying.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <Heart className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">For Everyone</h3>
                <p className="text-sm text-muted-foreground">
                  Whether you're managing chronic conditions, staying fit, or caring for loved ones—SahAI adapts to you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-2xl">
            <CardContent className="p-10">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Health Journey?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands who trust SahAI as their intelligent health companion
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted} className="text-lg px-10 py-7 shadow-lg">
                  Start Free Today
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.open("https://github.com/adityadeshpande41/SahAI", "_blank")} className="text-lg px-10 py-7">
                  View on GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
