import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

const ageGroups = ["18-34", "35-44", "45-54", "55-64", "65-74", "75+"];
const languages = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada"];
const conditions = ["Diabetes", "Hypertension", "Heart Disease", "Arthritis", "Asthma", "Thyroid", "Cholesterol"];
const diets = ["No preference", "Vegetarian", "Vegan", "Low sodium", "Diabetic-friendly", "Low cholesterol"];

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    ageGroup: "",
    language: "English",
    largeText: false,
    highContrast: false,
    simpleLanguage: false,
    voiceFirst: false,
    breakfastTime: "8:00 AM",
    lunchTime: "12:30 PM",
    dinnerTime: "7:30 PM",
    sleepTime: "10:00 PM",
    wakeTime: "6:30 AM",
    activityTime: "7:00 AM",
    activityDuration: "30 min",
    caregiverName: "",
    caregiverPhone: "",
    allergies: "",
    diet: "No preference",
    selectedConditions: [] as string[],
  });

  const toggleCondition = (c: string) => {
    setForm(prev => ({
      ...prev,
      selectedConditions: prev.selectedConditions.includes(c)
        ? prev.selectedConditions.filter(x => x !== c)
        : [...prev.selectedConditions, c],
    }));
  };

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0 && form.ageGroup.length > 0;
    return true;
  };

  const handleFinish = () => {
    localStorage.setItem("sahai-onboarded", "true");
    localStorage.setItem("sahai-user", JSON.stringify(form));
    setLocation("/");
  };

  const stepTitles = [
    "Let's start with the basics",
    "How would you like to interact?",
    "Tell us about your daily routine",
    "Optional: caregiver and health info",
    "You're all set!",
  ];

  const stepDescriptions = [
    "First things first - who are we helping today?",
    "Personalize your SahAI Twin experience",
    "Help us understand your daily patterns",
    "Add optional health & caregiver information",
    "Your SahAI Twin is ready to go!",
  ];

  const getStepColor = (stepNum: number) => {
    const colors = [
      "from-blue-500/20 to-cyan-500/20",
      "from-purple-500/20 to-pink-500/20",
      "from-amber-500/20 to-orange-500/20",
      "from-emerald-500/20 to-teal-500/20",
      "from-rose-500/20 to-pink-500/20",
    ];
    return colors[stepNum - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg animate-scale-in">
                <Heart className="w-11 h-11 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Set up your SahAI Twin
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                {stepDescriptions[step - 1]}
              </p>
            </div>
          </div>

          {/* Step Indicator - Visual Circles with Lines */}
          <div className="flex justify-center items-center gap-2 px-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;

              return (
                <div key={stepNum} className="flex items-center">
                  <div className="relative">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-4 ring-blue-500/30 scale-110'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-secondary text-muted-foreground'
                        }
                      `}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                    </div>
                  </div>
                  {stepNum < TOTAL_STEPS && (
                    <div
                      className={`
                        h-1 w-8 mx-1 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500'
                            : step > stepNum
                            ? 'bg-green-500'
                            : 'bg-secondary'
                        }
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Main Content Card */}
          <Card className={`
            bg-white shadow-lg border border-gray-200 rounded-2xl
            overflow-hidden animate-scale-in
            transition-all duration-300
          `}>
            <CardContent className="p-8 space-y-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">👤</span>
                      What should we call you?
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="rounded-xl text-base h-11 border-white/20 focus:border-white/40"
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      Age group
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {ageGroups.map(ag => (
                        <Button
                          key={ag}
                          variant={form.ageGroup === ag ? "default" : "secondary"}
                          onClick={() => setForm(p => ({ ...p, ageGroup: ag }))}
                          className="rounded-xl transition-all duration-200"
                          data-testid={`button-age-${ag}`}
                        >
                          {ag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Preferences & Accessibility */}
              {step === 2 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">🌐</span>
                      Preferred language
                    </Label>
                    <Select value={form.language} onValueChange={v => setForm(p => ({ ...p, language: v }))}>
                      <SelectTrigger className="rounded-xl h-11 border-white/20 focus:border-white/40" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">♿</span>
                      Accessibility preferences
                    </Label>
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
                      {[
                        { key: "largeText" as const, label: "Large text", icon: "🔤" },
                        { key: "highContrast" as const, label: "High contrast", icon: "⚫" },
                        { key: "simpleLanguage" as const, label: "Simple language", icon: "📝" },
                        { key: "voiceFirst" as const, label: "Voice-first mode", icon: "🎤" },
                      ].map(({ key, label, icon }) => (
                        <div key={key} className="flex items-center justify-between hover-elevate rounded-lg p-2 transition-colors">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">{icon}</span>
                            {label}
                          </span>
                          <Switch
                            checked={form[key]}
                            onCheckedChange={v => setForm(p => ({ ...p, [key]: v }))}
                            data-testid={`switch-${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Daily Routine */}
              {step === 3 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">🍽️</span>
                      Typical meal times
                    </Label>
                    <div className="bg-white/5 rounded-xl p-4 space-y-4 border border-white/10">
                      {[
                        { key: "breakfastTime" as const, label: "Breakfast", icon: "🥐" },
                        { key: "lunchTime" as const, label: "Lunch", icon: "🥗" },
                        { key: "dinnerTime" as const, label: "Dinner", icon: "🍽️" },
                      ].map(({ key, label, icon }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">{icon}</span>
                            {label}
                          </span>
                          <Input
                            value={form[key]}
                            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-32 text-center text-sm rounded-lg border-white/20 focus:border-white/40 h-9"
                            data-testid={`input-${key}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">😴</span>
                      Sleep window
                    </Label>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Input
                          value={form.sleepTime}
                          onChange={e => setForm(p => ({ ...p, sleepTime: e.target.value }))}
                          className="text-center text-sm rounded-lg border-white/20 focus:border-white/40 h-9"
                          data-testid="input-sleep"
                        />
                        <span className="text-sm text-muted-foreground font-medium">to</span>
                        <Input
                          value={form.wakeTime}
                          onChange={e => setForm(p => ({ ...p, wakeTime: e.target.value }))}
                          className="text-center text-sm rounded-lg border-white/20 focus:border-white/40 h-9"
                          data-testid="input-wake"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">🏃</span>
                      Activity window
                    </Label>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <Input
                          value={form.activityTime}
                          onChange={e => setForm(p => ({ ...p, activityTime: e.target.value }))}
                          className="text-center text-sm rounded-lg border-white/20 focus:border-white/40 h-9"
                          placeholder="Start time"
                          data-testid="input-activity-time"
                        />
                        <span className="text-sm text-muted-foreground font-medium">for</span>
                        <Input
                          value={form.activityDuration}
                          onChange={e => setForm(p => ({ ...p, activityDuration: e.target.value }))}
                          className="text-center text-sm rounded-lg border-white/20 focus:border-white/40 h-9"
                          placeholder="Duration"
                          data-testid="input-activity-duration"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Health & Caregiver Info */}
              {step === 4 && (
                <div className="space-y-6 animate-slide-up">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <span className="text-lg">📞</span>
                        Caregiver contact
                      </Label>
                      <span className="text-xs text-muted-foreground font-medium">Optional</span>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Name"
                        value={form.caregiverName}
                        onChange={e => setForm(p => ({ ...p, caregiverName: e.target.value }))}
                        className="rounded-xl h-11 border-white/20 focus:border-white/40"
                        data-testid="input-caregiver-name"
                      />
                      <Input
                        placeholder="Phone number"
                        value={form.caregiverPhone}
                        onChange={e => setForm(p => ({ ...p, caregiverPhone: e.target.value }))}
                        className="rounded-xl h-11 border-white/20 focus:border-white/40"
                        data-testid="input-caregiver-phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      Allergies
                    </Label>
                    <Input
                      placeholder="e.g., peanuts, shellfish"
                      value={form.allergies}
                      onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
                      className="rounded-xl h-11 border-white/20 focus:border-white/40"
                      data-testid="input-allergies"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <span className="text-lg">🍽️</span>
                      Diet preference
                    </Label>
                    <Select value={form.diet} onValueChange={v => setForm(p => ({ ...p, diet: v }))}>
                      <SelectTrigger className="rounded-xl h-11 border-white/20 focus:border-white/40" data-testid="select-diet">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {diets.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <span className="text-lg">🏥</span>
                        Health conditions
                      </Label>
                      <span className="text-xs text-muted-foreground font-medium">Optional</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex flex-wrap gap-2">
                        {conditions.map(c => (
                          <Badge
                            key={c}
                            variant={form.selectedConditions.includes(c) ? "default" : "secondary"}
                            className="cursor-pointer rounded-lg transition-all hover:scale-105"
                            onClick={() => toggleCondition(c)}
                            data-testid={`badge-condition-${c.toLowerCase()}`}
                          >
                            {form.selectedConditions.includes(c) && <Check className="w-3 h-3 mr-1" />}
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Celebration */}
              {step === 5 && (
                <div className="space-y-6 text-center animate-slide-up">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mx-auto shadow-lg shadow-yellow-400/40 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Welcome, {form.name || "friend"}!
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed max-w-md mx-auto">
                      Your SahAI Twin is ready. It will learn your routine and help you stay on track with medications, meals, and wellness.
                    </p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">✨ Ready to begin your wellness journey</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {step > 1 ? (
              <Button
                variant="secondary"
                onClick={() => setStep(s => s - 1)}
                className="rounded-xl h-11 px-6"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step === 4 && (
                <Button
                  variant="ghost"
                  onClick={() => setStep(5)}
                  className="rounded-xl h-11 px-4 text-muted-foreground"
                  data-testid="button-skip"
                >
                  Skip for now
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  data-testid="button-next"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  className="rounded-xl h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  data-testid="button-create-twin"
                >
                  Create My SahAI Twin
                  <Heart className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
