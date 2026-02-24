import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Languages,
  MessageSquare,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTodayMedications, useMarkMedicationTaken, useSnoozeMedication, useUploadPrescription, useMedicationAdherence } from "@/hooks/use-api";

export default function Medications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: meds, isLoading: medsLoading } = useTodayMedications();
  const { data: adherenceData } = useMedicationAdherence();
  const markTaken = useMarkMedicationTaken();
  const snoozeMed = useSnoozeMedication();
  const uploadPrescription = useUploadPrescription();
  
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const takenCount = meds?.schedule?.filter((m: any) => m.takenAt).length || 0;
  const totalCount = meds?.schedule?.length || 1;
  const adherence = adherenceData?.week?.adherenceRate || Math.round((takenCount / totalCount) * 100);

  const handleAction = async (id: string, action: "taken" | "snoozed" | "missed") => {
    if (action === "taken") {
      await markTaken.mutateAsync({ medicationId: id });
    } else if (action === "snoozed") {
      await snoozeMed.mutateAsync({ medicationId: id, snoozeMinutes: 30 });
    }
    // For missed, you could add additional API calls if needed
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadFile(file);
    try {
      const result = await uploadPrescription.mutateAsync(file);
      setExtractedData(result.extracted);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  if (medsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -m-6 p-6">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" data-testid="text-medications-title">Medications</h1>
          <p className="text-sm text-gray-600 mt-1">Track and manage your daily medications</p>
        </div>

      <Card className="bg-white shadow-lg border border-gray-200" data-testid="card-adherence">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-sm font-medium">Today's Adherence</span>
            <span className="text-sm font-bold text-primary tabular-nums">{adherence}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
              style={{ width: `${adherence}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2"><span className="tabular-nums">{takenCount}</span> of <span className="tabular-nums">{totalCount}</span> medications taken</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Today's Schedule</h2>
        <div className="space-y-3">
          {meds && meds.schedule && meds.schedule.length > 0 ? meds.schedule.map((med: any) => (
            <Card key={med.id} className={`bg-white shadow-lg border border-gray-200 ${med.takenAt ? "opacity-75" : ""}`} data-testid={`card-med-${med.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                      med.takenAt ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-primary/10 dark:bg-primary/20"
                    }`}>
                      {med.takenAt ? (
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Pill className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{med.name}</h3>
                        <Badge variant="secondary" className="text-xs no-default-active-elevate">{med.dosage}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {med.scheduledTime || med.frequency}
                        </span>
                        {med.instructions && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                            {med.instructions}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{med.frequency}</p>
                    </div>
                  </div>
                </div>
                {!med.takenAt && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border animate-scale-in">
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(med.id, "taken")} 
                      className="flex-1 active:scale-[0.97]" 
                      data-testid={`button-taken-${med.id}`}
                      disabled={markTaken.isPending}
                    >
                      {markTaken.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      Taken
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleAction(med.id, "snoozed")} className="active:scale-[0.97]" data-testid={`button-snooze-${med.id}`}>
                      <Clock className="w-3.5 h-3.5 mr-1" /> Snooze
                    </Button>
                  </div>
                )}
                {med.takenAt && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Taken at {new Date(med.takenAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )) : (
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No medications scheduled for today</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block" />Upload Prescription</h2>
        {!showUpload ? (
          <Button variant="secondary" onClick={() => setShowUpload(true)} className="w-full h-auto py-4" data-testid="button-upload-prescription">
            <Upload className="w-5 h-5 mr-2" />
            Upload Prescription Image
          </Button>
        ) : (
          <Card data-testid="card-upload-prescription" className="bg-white shadow-lg border border-gray-200">
            <CardContent className="p-4 space-y-4">
              {!extractedData ? (
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center transition-colors bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/5 dark:to-primary/10">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="prescription-upload"
                  />
                  <label htmlFor="prescription-upload" className="cursor-pointer" data-testid="dropzone-prescription">
                    {uploadPrescription.isPending ? (
                      <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-2" />
                    ) : (
                      <Camera className="w-8 h-8 mx-auto text-primary/60 mb-2" />
                    )}
                    <p className="text-sm font-medium">
                      {uploadPrescription.isPending ? "Analyzing prescription..." : "Drop image here or tap to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, PDF</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4 animate-slide-up">
                  <div className="bg-muted rounded-md p-4 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{uploadFile?.name}</p>
                      <p className="text-xs text-muted-foreground">Analyzed successfully</p>
                    </div>
                  </div>

                  {extractedData.medications?.map((med: any, idx: number) => (
                    <Card key={idx} className="bg-white shadow-lg border border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          <CardTitle className="text-sm">Extracted Medication {idx + 1}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Medicine Name</Label>
                          <Input defaultValue={med.name} className="text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Dose</Label>
                            <Input defaultValue={med.dosage} className="text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Frequency</Label>
                            <Input defaultValue={med.frequency} className="text-sm" />
                          </div>
                        </div>
                        {med.instructions && (
                          <div className="space-y-1">
                            <Label className="text-xs">Instructions</Label>
                            <Input defaultValue={med.instructions} className="text-sm" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setShowUpload(false);
                      setExtractedData(null);
                      setUploadFile(null);
                      // Refresh medications list
                      queryClient.invalidateQueries({ queryKey: ["medications"] });
                      queryClient.invalidateQueries({ queryKey: ["medications", "today"] });
                    }}
                  >
                    <Check className="w-4 h-4 mr-1" /> Done
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Card className="bg-white shadow-lg border border-gray-200" data-testid="card-med-explanation">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Understand Your Medication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ask your AI health copilot about any medication in the Voice/Chat tab for simple explanations in your language.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
