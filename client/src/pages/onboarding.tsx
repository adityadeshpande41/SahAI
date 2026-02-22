import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  const progress = (step / TOTAL_STEPS) * 100;

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl bg-primary/15 dark:bg-primary/25 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Set up your SahAI Twin</h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 && "Let's start with the basics"}
              {step === 2 && "How would you like to interact?"}
              {step === 3 && "Tell us about your daily routine"}
              {step === 4 && "Optional: caregiver and health info"}
              {step === 5 && "You're all set!"}
            </p>
          </div>

          <Progress value={progress} className="h-1.5" data-testid="progress-onboarding" />

          <Card>
            <CardContent className="p-5 space-y-4">
              {step === 1 && (
                <div className="space-y-4 animate-slide-up">
                  <div className="space-y-2">
                    <Label htmlFor="name">What should we call you?</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="text-base"
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age group</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ageGroups.map(ag => (
                        <Button
                          key={ag}
                          variant={form.ageGroup === ag ? "default" : "secondary"}
                          onClick={() => setForm(p => ({ ...p, ageGroup: ag }))}
                          data-testid={`button-age-${ag}`}
                        >
                          {ag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-slide-up">
                  <div className="space-y-2">
                    <Label>Preferred language</Label>
                    <Select value={form.language} onValueChange={v => setForm(p => ({ ...p, language: v }))}>
                      <SelectTrigger data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Accessibility preferences</Label>
                    {[
                      { key: "largeText" as const, label: "Large text" },
                      { key: "highContrast" as const, label: "High contrast" },
                      { key: "simpleLanguage" as const, label: "Simple language" },
                      { key: "voiceFirst" as const, label: "Voice-first mode" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={form[key]}
                          onCheckedChange={v => setForm(p => ({ ...p, [key]: v }))}
                          data-testid={`switch-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-slide-up">
                  <Label>Typical meal times</Label>
                  {[
                    { key: "breakfastTime" as const, label: "Breakfast" },
                    { key: "lunchTime" as const, label: "Lunch" },
                    { key: "dinnerTime" as const, label: "Dinner" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <Input
                        value={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-32 text-center text-sm"
                        data-testid={`input-${key}`}
                      />
                    </div>
                  ))}
                  <div className="pt-2">
                    <Label>Sleep window</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={form.sleepTime}
                        onChange={e => setForm(p => ({ ...p, sleepTime: e.target.value }))}
                        className="text-center text-sm"
                        data-testid="input-sleep"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        value={form.wakeTime}
                        onChange={e => setForm(p => ({ ...p, wakeTime: e.target.value }))}
                        className="text-center text-sm"
                        data-testid="input-wake"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Label>Activity window</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={form.activityTime}
                        onChange={e => setForm(p => ({ ...p, activityTime: e.target.value }))}
                        className="text-center text-sm"
                        placeholder="Start time"
                        data-testid="input-activity-time"
                      />
                      <span className="text-sm text-muted-foreground">for</span>
                      <Input
                        value={form.activityDuration}
                        onChange={e => setForm(p => ({ ...p, activityDuration: e.target.value }))}
                        className="text-center text-sm"
                        placeholder="Duration"
                        data-testid="input-activity-duration"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-slide-up">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Caregiver contact</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <Input
                      placeholder="Name"
                      value={form.caregiverName}
                      onChange={e => setForm(p => ({ ...p, caregiverName: e.target.value }))}
                      data-testid="input-caregiver-name"
                    />
                    <Input
                      placeholder="Phone number"
                      value={form.caregiverPhone}
                      onChange={e => setForm(p => ({ ...p, caregiverPhone: e.target.value }))}
                      data-testid="input-caregiver-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <Input
                      placeholder="e.g., peanuts, shellfish"
                      value={form.allergies}
                      onChange={e => setForm(p => ({ ...p, allergies: e.target.value }))}
                      data-testid="input-allergies"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diet preference</Label>
                    <Select value={form.diet} onValueChange={v => setForm(p => ({ ...p, diet: v }))}>
                      <SelectTrigger data-testid="select-diet">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {diets.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Health conditions</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {conditions.map(c => (
                        <Badge
                          key={c}
                          variant={form.selectedConditions.includes(c) ? "default" : "secondary"}
                          className="cursor-pointer"
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
              )}

              {step === 5 && (
                <div className="space-y-4 text-center animate-slide-up">
                  <div className="w-20 h-20 rounded-2xl bg-primary/15 dark:bg-primary/25 flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Welcome, {form.name || "friend"}!</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your SahAI Twin is ready. It will learn your routine and help you stay on track with medications, meals, and wellness.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)} data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < TOTAL_STEPS ? (
              <div className="flex items-center gap-2">
                {step === 4 && (
                  <Button variant="ghost" onClick={() => setStep(5)} className="text-muted-foreground" data-testid="button-skip">
                    Skip for now
                  </Button>
                )}
                <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} data-testid="button-next">
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleFinish} data-testid="button-create-twin">
                Create My SahAI Twin
                <Heart className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
