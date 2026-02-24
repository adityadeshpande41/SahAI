import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Pill, MessageCircle, Brain, Users, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/register");
  };

  const handleSignIn = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SahAI
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button className="text-gray-600 hover:text-gray-900 font-medium">Features</button>
          <button className="text-gray-600 hover:text-gray-900 font-medium">About</button>
          <Button variant="ghost" onClick={handleSignIn} className="font-medium">
            Sign In
          </Button>
          <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700 shadow-md">
            <Sparkles className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Personal</span>
              <br />
              Health <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Copilot</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              An AI-powered health companion here to help you manage medications, track meals, monitor symptoms, 
              and stay connected with caregivers.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </Button>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-gray-200">
              {/* Mini Dashboard Preview */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">SahAI</h3>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    You're following your usual routine
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Routine Status</span>
                  <span className="font-semibold text-gray-900">100%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                  <span>🏠</span> home
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-medium text-orange-700">
                  <span>☀️</span> Warm & Humid
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                  <span>🌡️</span> 32°C
                </div>
              </div>
            </div>

            {/* Floating decoration */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                <Pill className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Medication Management</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track medications, reminders, monitor the heal-language
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                <MessageCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Voice-First AI Chat</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Talk in simple to your own, consult with your helper
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-teal-100 border-teal-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                <Brain className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Routine Twin</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Learns your day pigs habits earlier to you avoided conditions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Caregiver Connect</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ready family in life-care reviews and wider first-target relations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why Choose Section */}
        <div className="mt-24 bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose SahAI?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Smart Insights</h3>
                <p className="text-sm text-gray-600">No unusual pattern detected</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Quick insights</h3>
                <p className="text-sm text-gray-600">Warm & Humid ask your routine</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Privacy-First Design</h3>
                <p className="text-sm text-gray-600">Your easily your parents read actually and actual health matters</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Designed for Seniors</h3>
                <p className="text-sm text-gray-600">Large text, set help on their settings, easier almost assistants</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
