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
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  useTwinState, 
  useCurrentRisks, 
  useWeather, 
  useCurrentContext,
  useMedicationAdherence,
  useCreateMeal,
  useCreateSymptom,
  useCreateActivity,
  useTodayMedications,
  useMarkMedicationTaken,
  useCurrentUser,
} from "@/hooks/use-api";
import { getGreeting, getCurrentDate } from "@/lib/mock-data";
import { Link } from "wouter";

const twinStateConfig = {
  routine: { color: "bg-emerald-500 dark:bg-emerald-400", label: "On Routine", textColor: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800", glow: "from-emerald-500/20" },
  drift: { color: "bg-amber-500 dark:bg-amber-400", label: "Drift Detected", textColor: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800", glow: "from-amber-500/20" },
  concern: { color: "bg-red-500 dark:bg-red-400", label: "Higher Concern", textColor: "text-red-700 dark:text-red-300", ring: "ring-red-200 dark:ring-red-800", glow: "from-red-500/20" },
};

const chipIcons: Record<string, typeof Pill> = {
  pill: Pill,
  utensils: UtensilsCrossed,
  droplets: Droplets,
  activity: Activity,
  home: Home,
};

const chipColors = {
  warning: "bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30",
  caution: "bg-orange-100/80 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/30",
  info: "bg-sky-100/80 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/30",
  success: "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30",
};

const riskColors = {
  low: { bg: "bg-emerald-50/80 dark:bg-emerald-950/30", border: "border-emerald-200/60 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  medium: { bg: "bg-amber-50/80 dark:bg-amber-950/30", border: "border-amber-200/60 dark:border-amber-800/40", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  high: { bg: "bg-red-50/80 dark:bg-red-950/30", border: "border-red-200/60 dark:border-red-800/40", badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

export default function Dashboard() {
  const { toast } = useToast();
  const [quickActions, setQuickActions] = useState({
    tookMeds: false,
    ate: false,
    feelUnwell: false,
    goingOut: false,
  });

  // Fetch real data from API
  const { data: twinState, isLoading: twinLoading } = useTwinState();
  const { data: risksData, isLoading: risksLoading } = useCurrentRisks();
  const { data: weather } = useWeather();
  const { data: context } = useCurrentContext();
  const { data: adherence } = useMedicationAdherence();
  const { data: userData, isLoading: userLoading, isFetching: userFetching } = useCurrentUser();
  
  // Debug logging
  console.log("Dashboard user data:", userData);
  console.log("Dashboard user loading:", userLoading, "fetching:", userFetching);
  
  // Handle both response formats: { user: {...} } or direct user object
  const user = userData?.user || userData;

  // Mutations
  const createMeal = useCreateMeal();
  const createSymptom = useCreateSymptom();
  const createActivity = useCreateActivity();
  const { data: todayMeds } = useTodayMedications();
  const markMedicationTaken = useMarkMedicationTaken();

  // Use first active risk or create default
  const riskGuidance = risksData?.alerts?.[0] || {
    level: "low",
    title: "Everything looks good",
    unusual: "No unusual patterns detected",
    why: "Your routine is on track",
    action: "Keep up the good work!",
    baseline: "Following your usual routine",
    triggers: [],
  };

  const config = twinStateConfig[twinState?.state || "routine"];
  const risk = riskColors[riskGuidance.level];

  const handleQuickAction = async (action: keyof typeof quickActions, label: string) => {
    const newState = !quickActions[action];
    setQuickActions(prev => ({ ...prev, [action]: newState }));

    if (newState) {
      try {
        // Log the action to backend
        if (action === "tookMeds") {
          // Mark the first pending medication as taken
          const pendingMed = todayMeds?.schedule?.find((m: any) => !m.takenAt);
          if (pendingMed) {
            await markMedicationTaken.mutateAsync({ medicationId: pendingMed.id });
            toast({
              title: "Medication logged",
              description: `${pendingMed.name} ${pendingMed.dose} marked as taken.`,
            });
          } else {
            toast({
              title: "No pending medications",
              description: "All medications for today have been taken or none are scheduled.",
            });
            setQuickActions(prev => ({ ...prev, [action]: false }));
            return;
          }
        } else if (action === "ate") {
          await createMeal.mutateAsync({
            mealType: "snack",
            foods: "Quick snack",
            loggedAt: new Date(),
          });
        } else if (action === "feelUnwell") {
          await createSymptom.mutateAsync({
            symptom: "General discomfort",
            severity: 3,
            loggedAt: new Date(),
          });
        } else if (action === "goingOut") {
          await createActivity.mutateAsync({
            activity: "going out",
            loggedAt: new Date(),
          });
        }
      } catch (error: any) {
        console.error("Quick action error:", error);
        toast({
          title: "Action failed",
          description: error.message || "Please try again or use the detailed page.",
          variant: "destructive",
        });
        setQuickActions(prev => ({ ...prev, [action]: false }));
      }
    } else {
      toast({
        title: "Action undone",
        description: `Removed: ${label}`,
      });
    }
  };

  if (twinLoading || risksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-greeting">
            {getGreeting()}, <span className="text-gradient">{user?.name || "User"}</span>
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-date">{getCurrentDate()}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-xs text-muted-foreground">
          <CloudSun className="w-3.5 h-3.5 text-amber-500" />
          <span>{weather?.temp || "32°C"}</span>
        </div>
      </div>

      <Card className="relative overflow-hidden border-0 card-elevated" data-testid="card-twin">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/4 dark:from-primary/10 dark:via-transparent dark:to-primary/8" />
        <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-radial ${config.glow} to-transparent opacity-60 blur-2xl`} />
        <CardContent className="relative p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-2xl bg-primary/10 dark:bg-primary/20 animate-gentle-pulse" />
                <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse-ring" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <div className="absolute w-3 h-3 rounded-full bg-primary/40 animate-orbit" style={{ top: "50%", left: "50%", marginTop: "-6px", marginLeft: "-6px" }}>
                  <Zap className="w-3 h-3 text-primary" />
                </div>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${config.color} ring-2 ring-card shadow-sm`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-bold text-base">Your Routine Twin</h2>
                <Badge variant="secondary" className={`text-[10px] no-default-active-elevate ${config.textColor} px-2`}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-twin-status">
                {twinState?.message || "Loading..."}
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex-1 h-2.5 rounded-full bg-muted/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000 ease-out"
                    style={{ width: `${twinState?.score || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-primary tabular-nums">{twinState?.score || 0}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" data-testid="status-chips">
        {/* Status chips would come from context API - using simplified version for now */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-sky-100/80 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/30 shadow-sm">
          <Home className="w-3.5 h-3.5" />
          {context?.locationState || "At home"}
        </div>
        {weather && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
            <CloudSun className="w-3.5 h-3.5" />
            {weather.condition}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-3 h-3" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-2.5" data-testid="quick-actions">
          {[
            { key: "tookMeds" as const, label: "I took meds", icon: Pill, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
            { key: "ate" as const, label: "I ate", icon: UtensilsCrossed, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" },
            { key: "feelUnwell" as const, label: "Feel unwell", icon: Frown, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20" },
            { key: "goingOut" as const, label: "Going out", icon: DoorOpen, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/20" },
          ].map(({ key, label, icon: Icon, color, bg }) => (
            <Button
              key={key}
              variant={quickActions[key] ? "default" : "secondary"}
              className={`h-auto py-3.5 flex-col gap-1.5 rounded-xl transition-all duration-200 ${
                !quickActions[key] ? `${color} ${bg} border-0 hover:shadow-sm active:scale-[0.97]` : "shadow-sm"
              }`}
              onClick={() => handleQuickAction(key, label)}
              data-testid={`button-${key}`}
            >
              {quickActions[key] ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              <span className="text-[11px] font-medium leading-tight">{label}</span>
            </Button>
          ))}
          <Link href="/voice">
            <Button variant="secondary" className="h-auto py-3.5 flex-col gap-1.5 w-full rounded-xl text-primary bg-primary/5 dark:bg-primary/10 border-0 hover:shadow-sm active:scale-[0.97]" data-testid="button-talk-sahai">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[11px] font-medium leading-tight">Talk to SahAI</span>
            </Button>
          </Link>
          <Link href="/insights">
            <Button variant="secondary" className="h-auto py-3.5 flex-col gap-1.5 w-full rounded-xl text-muted-foreground bg-muted/40 border-0 hover:shadow-sm active:scale-[0.97]" data-testid="button-explain">
              <HelpCircle className="w-5 h-5" />
              <span className="text-[11px] font-medium leading-tight">Explain</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className={`border ${risk.border} ${risk.bg} card-elevated`} data-testid="card-risk">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Live Situation Guard</CardTitle>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${risk.badge}`}>
              {riskGuidance.level.charAt(0).toUpperCase() + riskGuidance.level.slice(1)} Risk
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">What's unusual</p>
              <p className="text-sm" data-testid="text-risk-unusual">{riskGuidance.unusual}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-background/60 dark:bg-background/30 border border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">What to do</p>
              <p className="text-sm font-medium" data-testid="text-risk-action">{riskGuidance.action}</p>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="why" className="border-0">
              <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:text-foreground" data-testid="button-why-flagged">
                Why SahAI flagged this
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2.5 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Baseline</p>
                    <p>{riskGuidance.baseline}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Triggers</p>
                    <ul className="space-y-1.5">
                      {(riskGuidance.triggers || []).map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                      {(!riskGuidance.triggers || riskGuidance.triggers.length === 0) && (
                        <li className="text-muted-foreground">No specific triggers</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Why it matters</p>
                    <p>{riskGuidance.why}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="card-context-snapshot">
        {[
          { icon: Home, label: context?.locationState || "Home", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
          { icon: CloudSun, label: weather?.condition || "Loading...", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { icon: Activity, label: context?.currentActivity || "Resting", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/20" },
        ].map(({ icon: Icon, label, color, bg }, i) => (
          <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${bg} border border-border/30`}>
            <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
            <span className="text-xs font-medium truncate">{label}</span>
          </div>
        ))}
      </div>

      <Card className="card-elevated" data-testid="card-weekly-snapshot">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">This Week</CardTitle>
            </div>
            <Link href="/insights">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto py-1 px-2">
                Details <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: `${adherence?.week?.rate || 0}%`, label: "Med Adherence", color: "text-primary" },
              { value: `${adherence?.week?.taken || 0}/${adherence?.week?.total || 0}`, label: "Meals Logged", color: "text-amber-600 dark:text-amber-400" },
              { value: "0", label: "Symptoms", color: "text-red-500 dark:text-red-400" },
            ].map(({ value, label, color }, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-muted/40">
                <p className={`text-xl font-bold ${color} tabular-nums`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
