import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useRecentSymptoms, useCreateSymptom, useRecentActivities, useCreateActivity, useSymptomsMotivation } from "@/hooks/use-api";

const symptomQuickOptions = ["Dizziness", "Fatigue", "Headache", "Nausea", "Pain", "Shortness of breath"];

const activityIcons: Record<string, typeof Footprints> = {
  Walking: Footprints,
  Resting: Bed,
  "Going out": DoorOpen,
  "Back home": Home,
};

export default function Symptoms() {
  const { data: symptoms, isLoading: symptomsLoading } = useRecentSymptoms(7);
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities(10);
  const createSymptom = useCreateSymptom();
  const { data: symptomsMotivation } = useSymptomsMotivation();
  const createActivity = useCreateActivity();
  
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [severity, setSeverity] = useState([3]);
  const [notes, setNotes] = useState("");
  const [currentActivity, setCurrentActivity] = useState("Resting");

  const logSymptom = async () => {
    if (!selectedSymptom) return;
    await createSymptom.mutateAsync({
      symptom: selectedSymptom,
      severity: severity[0],
      loggedAt: new Date(),
      notes: notes || undefined,
    });
    setSelectedSymptom(null);
    setSeverity([3]);
    setNotes("");
  };

  const logActivity = async (activity: string) => {
    setCurrentActivity(activity);
    await createActivity.mutateAsync({
      activity: activity,
      loggedAt: new Date(),
    });
  };

  const severityLabels = ["", "Very mild", "Mild", "Moderate", "Strong", "Severe"];
  const severityColors = ["", "text-emerald-600 dark:text-emerald-400", "text-emerald-600 dark:text-emerald-400", "text-amber-600 dark:text-amber-400", "text-orange-600 dark:text-orange-400", "text-red-600 dark:text-red-400"];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-symptoms-title">Symptoms & Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Log how you're feeling and what you're doing</p>
      </div>

      {symptomsMotivation?.message && (
        <Card className="card-elevated bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800" data-testid="card-symptoms-motivation">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📝</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">{symptomsMotivation.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Button onClick={logSymptom} disabled={createSymptom.isPending} data-testid="button-log-symptom">
                  {createSymptom.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  Log Symptom
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

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Recent Symptoms</h2>
        {symptomsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : symptoms && symptoms.symptoms && symptoms.symptoms.length > 0 ? (
          <div className="space-y-2">
            {symptoms.symptoms.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-card" data-testid={`item-symptom-${s.id}`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                  s.severity <= 2 ? "text-amber-500" : s.severity <= 3 ? "text-orange-500" : "text-red-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{s.symptom}</span>
                    <span className={`text-xs ${severityColors[s.severity]}`}>{s.severity}/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(s.loggedAt).toLocaleString()}</p>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No symptoms logged yet</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Recent Activity</h2>
        {activitiesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : activities && activities.activities && activities.activities.length > 0 ? (
          <div className="space-y-2">
            {activities.activities.slice(0, 5).map((a: any) => {
              const Icon = activityIcons[a.activityType] || Activity;
              return (
                <div key={a.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-card" data-testid={`item-activity-${a.id}`}>
                  <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{a.activityType}</span>
                    <p className="text-xs text-muted-foreground">{new Date(a.loggedAt).toLocaleString()}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No activities logged yet</p>
        )}
      </div>
    </div>
  );
}
