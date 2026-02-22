import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Pill,
  Check,
  Clock,
  X,
  Upload,
  Camera,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { medications as initialMeds, type Medication } from "@/lib/mock-data";

export default function Medications() {
  const { toast } = useToast();
  const [meds, setMeds] = useState<Medication[]>(initialMeds);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(false);

  const takenCount = meds.filter(m => m.taken).length;
  const adherence = Math.round((takenCount / meds.length) * 100);

  const handleAction = (id: number, action: "taken" | "snoozed" | "missed") => {
    setMeds(prev => prev.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        taken: action === "taken",
        snoozed: action === "snoozed",
        missed: action === "missed",
      };
    }));
    const med = meds.find(m => m.id === id);
    toast({
      title: action === "taken" ? "Medication taken" : action === "snoozed" ? "Snoozed" : "Marked missed",
      description: `${med?.name} ${med?.dose} - ${action}`,
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-medications-title">Medications</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage your daily medications</p>
      </div>

      <Card data-testid="card-adherence">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm font-medium">Today's Adherence</span>
            <span className="text-sm font-bold text-primary">{adherence}%</span>
          </div>
          <Progress value={adherence} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{takenCount} of {meds.length} medications taken</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Today's Schedule</h2>
        <div className="space-y-3">
          {meds.map(med => (
            <Card key={med.id} className={med.taken ? "opacity-75" : ""} data-testid={`card-med-${med.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                      med.taken ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10 dark:bg-primary/20"
                    }`}>
                      {med.taken ? (
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Pill className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{med.name}</h3>
                        <Badge variant="secondary" className="text-xs no-default-active-elevate">{med.dose}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {med.timing}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          med.beforeFood
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                        }`}>
                          {med.beforeFood ? "Before food" : "After food"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{med.frequency}</p>
                    </div>
                  </div>
                </div>
                {!med.taken && !med.missed && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Button size="sm" onClick={() => handleAction(med.id, "taken")} className="flex-1" data-testid={`button-taken-${med.id}`}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Taken
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAction(med.id, "snoozed")} data-testid={`button-snooze-${med.id}`}>
                      <Clock className="w-3.5 h-3.5 mr-1" /> Snooze
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAction(med.id, "missed")} data-testid={`button-missed-${med.id}`}>
                      <X className="w-3.5 h-3.5 mr-1" /> Missed
                    </Button>
                  </div>
                )}
                {med.taken && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Taken
                    </span>
                  </div>
                )}
                {med.missed && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" /> Missed
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Upload Prescription</h2>
        {!showUpload ? (
          <Button variant="secondary" onClick={() => setShowUpload(true)} className="w-full h-auto py-4" data-testid="button-upload-prescription">
            <Upload className="w-5 h-5 mr-2" />
            Upload Prescription Image
          </Button>
        ) : (
          <Card data-testid="card-upload-prescription">
            <CardContent className="p-4 space-y-4">
              {!uploadPreview ? (
                <div
                  className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer transition-colors"
                  onClick={() => setUploadPreview(true)}
                  data-testid="dropzone-prescription"
                >
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Drop image here or tap to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, PDF</p>
                </div>
              ) : (
                <div className="space-y-4 animate-slide-up">
                  <div className="bg-muted rounded-md p-4 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">prescription_scan.jpg</p>
                      <p className="text-xs text-muted-foreground">Uploaded just now</p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm">Extracted Medication</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <Label className="text-xs">Medicine Name</Label>
                          <Badge variant="secondary" className="text-xs no-default-active-elevate">95% confidence</Badge>
                        </div>
                        <Input defaultValue="Losartan" className="text-sm" data-testid="input-extracted-name" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Dose</Label>
                          <Input defaultValue="50mg" className="text-sm" data-testid="input-extracted-dose" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frequency</Label>
                          <Input defaultValue="Once daily" className="text-sm" data-testid="input-extracted-freq" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Timing</Label>
                        <Input defaultValue="Morning, after food" className="text-sm" data-testid="input-extracted-timing" />
                      </div>
                      <Button className="w-full" data-testid="button-confirm-add">
                        <Check className="w-4 h-4 mr-1" /> Confirm & Add to Schedule
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
