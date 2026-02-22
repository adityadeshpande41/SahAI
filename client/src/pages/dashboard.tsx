import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pill,
  UtensilsCrossed,
  Frown,
  DoorOpen,
  MessageCircle,
  HelpCircle,
  ShieldAlert,
  Droplets,
  AlertTriangle,
  CloudSun,
  Check,
  Heart,
  TrendingUp,
  Activity,
  Home,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  userProfile,
  statusChips,
  riskGuidance,
  twinState,
  getGreeting,
  getCurrentDate,
  weatherData,
  weeklyInsights,
  contextSnapshot,
} from "@/lib/mock-data";
import { Link } from "wouter";

const twinStateConfig = {
  routine: { color: "bg-emerald-500 dark:bg-emerald-400", label: "On Routine", textColor: "text-emerald-700 dark:text-emerald-300" },
  drift: { color: "bg-amber-500 dark:bg-amber-400", label: "Drift Detected", textColor: "text-amber-700 dark:text-amber-300" },
  concern: { color: "bg-red-500 dark:bg-red-400", label: "Higher Concern", textColor: "text-red-700 dark:text-red-300" },
};

const chipIcons: Record<string, typeof Pill> = {
  pill: Pill,
  utensils: UtensilsCrossed,
  droplets: Droplets,
  activity: Activity,
  home: Home,
};

const chipColors = {
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  caution: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const riskColors = {
  low: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  medium: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  high: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

export default function Dashboard() {
  const { toast } = useToast();
  const [quickActions, setQuickActions] = useState({
    tookMeds: false,
    ate: false,
    feelUnwell: false,
    goingOut: false,
  });

  const config = twinStateConfig[twinState.state];
  const risk = riskColors[riskGuidance.level];

  const handleQuickAction = (action: keyof typeof quickActions, label: string) => {
    setQuickActions(prev => ({ ...prev, [action]: !prev[action] }));
    toast({
      title: quickActions[action] ? "Action undone" : "Noted!",
      description: quickActions[action] ? `Removed: ${label}` : `${label} has been recorded.`,
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-greeting">
          {getGreeting()}, {userProfile.name}
        </h1>
        <p className="text-sm text-muted-foreground" data-testid="text-date">{getCurrentDate()}</p>
      </div>

      <Card className="relative border-0 bg-gradient-to-br from-primary/8 via-card to-primary/4 dark:from-primary/12 dark:via-card dark:to-primary/6" data-testid="card-twin">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-primary/15 dark:bg-primary/25 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary animate-gentle-pulse" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${config.color} ring-2 ring-card`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h2 className="font-semibold text-base">Your Routine Twin</h2>
                <Badge variant="secondary" className={`text-xs no-default-active-elevate ${config.textColor}`}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-twin-status">
                {twinState.message}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${twinState.score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{twinState.score}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" data-testid="status-chips">
        {statusChips.map(chip => {
          const Icon = chipIcons[chip.icon] || AlertTriangle;
          return (
            <div
              key={chip.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${chipColors[chip.type]}`}
              data-testid={`chip-${chip.id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {chip.label}
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
          <CloudSun className="w-3.5 h-3.5" />
          {weatherData.temp} {weatherData.condition}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="quick-actions">
          {[
            { key: "tookMeds" as const, label: "I took meds", icon: Pill, color: "text-emerald-600 dark:text-emerald-400" },
            { key: "ate" as const, label: "I ate", icon: UtensilsCrossed, color: "text-amber-600 dark:text-amber-400" },
            { key: "feelUnwell" as const, label: "I feel unwell", icon: Frown, color: "text-red-500 dark:text-red-400" },
            { key: "goingOut" as const, label: "Going out", icon: DoorOpen, color: "text-sky-600 dark:text-sky-400" },
          ].map(({ key, label, icon: Icon, color }) => (
            <Button
              key={key}
              variant={quickActions[key] ? "default" : "secondary"}
              className={`h-auto py-4 flex-col gap-2 ${!quickActions[key] ? color : ""}`}
              onClick={() => handleQuickAction(key, label)}
              data-testid={`button-${key}`}
            >
              {quickActions[key] ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              <span className="text-xs font-medium">{label}</span>
            </Button>
          ))}
          <Link href="/voice">
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2 w-full text-primary" data-testid="button-talk-sahai">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Talk to SahAI</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" className="h-auto py-4 flex-col gap-2 w-full text-muted-foreground" data-testid="button-explain">
              <HelpCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Explain simply</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className={`border ${risk.border} ${risk.bg}`} data-testid="card-risk">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Live Situation Guard</CardTitle>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${risk.badge}`}>
              {riskGuidance.level.charAt(0).toUpperCase() + riskGuidance.level.slice(1)} Risk
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">What's unusual</p>
              <p className="text-sm" data-testid="text-risk-unusual">{riskGuidance.unusual}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">What to do</p>
              <p className="text-sm font-medium" data-testid="text-risk-action">{riskGuidance.action}</p>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="why" className="border-0">
              <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground" data-testid="button-why-flagged">
                Why SahAI flagged this
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Baseline</p>
                    <p>{riskGuidance.baseline}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Triggers</p>
                    <ul className="space-y-1">
                      {riskGuidance.triggers.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Why it matters</p>
                    <p>{riskGuidance.why}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-dashed" data-testid="card-context-snapshot">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Context Snapshot</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Home className="w-3 h-3 text-emerald-500" />
              <span>{contextSnapshot.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CloudSun className="w-3 h-3 text-amber-500" />
              <span>{contextSnapshot.weather}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-sky-500" />
              <span>{contextSnapshot.activity}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-weekly-snapshot">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">This Week</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{weeklyInsights.medAdherence}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Med Adherence</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{weeklyInsights.mealsLogged}/{weeklyInsights.totalMeals}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Meals Logged</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{weeklyInsights.symptomsReported}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Symptoms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
