import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Activity,
  Footprints,
  Bed,
  DoorOpen,
  Home,
  Check,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  symptomQuickOptions,
  recentSymptoms,
  recentActivities,
  type SymptomEntry,
  type ActivityEntry,
} from "@/lib/mock-data";

const activityIcons: Record<string, typeof Footprints> = {
  Walking: Footprints,
  Resting: Bed,
  "Going out": DoorOpen,
  "Back home": Home,
};

export default function Symptoms() {
  const { toast } = useToast();
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [severity, setSeverity] = useState([3]);
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(recentSymptoms);
  const [activities, setActivities] = useState<ActivityEntry[]>(recentActivities);
  const [currentActivity, setCurrentActivity] = useState("Resting");

  const logSymptom = () => {
    if (!selectedSymptom) return;
    const entry: SymptomEntry = {
      id: Date.now(),
      symptom: selectedSymptom,
      severity: severity[0],
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      date: "Today",
      notes: notes || undefined,
    };
    setSymptoms(prev => [entry, ...prev]);
    setSelectedSymptom(null);
    setSeverity([3]);
    setNotes("");
    toast({ title: "Symptom logged", description: `${selectedSymptom} (severity ${severity[0]}/5)` });
  };

  const logActivity = (activity: string) => {
    setCurrentActivity(activity);
    const entry: ActivityEntry = {
      id: Date.now(),
      activity,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      date: "Today",
    };
    setActivities(prev => [entry, ...prev]);
    toast({ title: "Activity updated", description: activity });
  };

  const severityLabels = ["", "Very mild", "Mild", "Moderate", "Strong", "Severe"];
  const severityColors = ["", "text-emerald-600 dark:text-emerald-400", "text-emerald-600 dark:text-emerald-400", "text-amber-600 dark:text-amber-400", "text-orange-600 dark:text-orange-400", "text-red-600 dark:text-red-400"];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-symptoms-title">Symptoms & Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Log how you're feeling and what you're doing</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Log a Symptom</h2>
        <Card className="card-elevated" data-testid="card-log-symptom">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {symptomQuickOptions.map(s => (
                <Badge
                  key={s}
                  variant={selectedSymptom === s ? "default" : "secondary"}
                  className="cursor-pointer text-sm py-1.5 px-3"
                  onClick={() => setSelectedSymptom(selectedSymptom === s ? null : s)}
                  data-testid={`badge-symptom-${s.toLowerCase()}`}
                >
                  {selectedSymptom === s && <Check className="w-3 h-3 mr-1" />}
                  {s}
                </Badge>
              ))}
            </div>
            {selectedSymptom && (
              <div className="space-y-3 animate-scale-in">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <Label className="text-sm">Severity</Label>
                    <span className={`text-sm font-medium tabular-nums flex items-center gap-1.5 ${severityColors[severity[0]]}`}>
                      <span className={`w-2 h-2 rounded-full inline-block ${severity[0] <= 2 ? "bg-emerald-500" : severity[0] <= 3 ? "bg-amber-500" : severity[0] <= 4 ? "bg-orange-500" : "bg-red-500"}`} />
                      {severity[0]}/5 - {severityLabels[severity[0]]}
                    </span>
                  </div>
                  <Slider
                    value={severity}
                    onValueChange={setSeverity}
                    min={1}
                    max={5}
                    step={1}
                    className="py-2"
                    data-testid="slider-severity"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Notes (optional)</Label>
                  <Textarea
                    placeholder="Any additional details..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="resize-none text-sm"
                    rows={2}
                    data-testid="textarea-symptom-notes"
                  />
                </div>
                <Button onClick={logSymptom} data-testid="button-log-symptom">
                  <Check className="w-4 h-4 mr-1" /> Log Symptom
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Current Activity</h2>
        <Card className="card-elevated" data-testid="card-activity">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                {(() => { const Icon = activityIcons[currentActivity] || Activity; return <Icon className="w-5 h-5 text-primary" />; })()}
              </div>
              <div>
                <p className="font-semibold text-sm">{currentActivity}</p>
                <p className="text-xs text-muted-foreground">Updated just now</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Walking", icon: Footprints },
                { label: "Resting", icon: Bed },
                { label: "Going out", icon: DoorOpen },
                { label: "Back home", icon: Home },
              ].map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  variant={currentActivity === label ? "default" : "secondary"}
                  size="sm"
                  onClick={() => logActivity(label)}
                  data-testid={`button-activity-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1" /> {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200 dark:border-amber-800" data-testid="card-pattern-insight">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Pattern Detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You reported dizziness twice this week, usually in the afternoon. This may be related to delayed lunch times.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Recent Symptoms</h2>
        <div className="space-y-2">
          {symptoms.slice(0, 5).map(s => (
            <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-card" data-testid={`item-symptom-${s.id}`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                s.severity <= 2 ? "text-amber-500" : s.severity <= 3 ? "text-orange-500" : "text-red-500"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{s.symptom}</span>
                  <span className={`text-xs ${severityColors[s.severity]}`}>{s.severity}/5</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.date} at {s.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Recent Activity</h2>
        <div className="space-y-2">
          {activities.slice(0, 5).map(a => {
            const Icon = activityIcons[a.activity] || Activity;
            return (
              <div key={a.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-card" data-testid={`item-activity-${a.id}`}>
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{a.activity}</span>
                  <p className="text-xs text-muted-foreground">{a.date} at {a.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
