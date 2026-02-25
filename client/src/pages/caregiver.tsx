import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Phone,
  Shield,
  Bell,
  AlertTriangle,
  Check,
  User,
  Clock,
  Pill,
  Activity,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCaregivers, useCreateCaregiver, useSendCaregiverUpdate } from "@/hooks/use-api";

export default function Caregiver() {
  const { toast } = useToast();
  const { data: caregivers, isLoading, refetch } = useCaregivers();
  const createCaregiver = useCreateCaregiver();
  const sendUpdate = useSendCaregiverUpdate();
  
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverRelation, setCaregiverRelation] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("daily");
  const [showAlert, setShowAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Health goals state (for caregiver to set)
  const [healthGoals, setHealthGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    exerciseMinutes: 30,
    medicationReminders: true,
  });
  
  // Shareable link state
  const [shareableLink, setShareableLink] = useState("");
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  // Load existing caregiver data
  const allCaregivers = caregivers || [];
  
  // Get only the most recent caregiver (filter duplicates)
  const existingCaregiver = allCaregivers.length > 0 
    ? allCaregivers.reduce((latest: any, current: any) => {
        if (!latest) return current;
        return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
      }, null)
    : null;
  
  const handleSave = async () => {
    if (!caregiverName || !caregiverEmail) {
      toast({
        title: "Missing information",
        description: "Please fill in name and email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(caregiverEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    await createCaregiver.mutateAsync({
      name: caregiverName,
      email: caregiverEmail,
      relationship: caregiverRelation,
      notificationPreferences: {
        level: privacyLevel,
      },
    });
    setIsEditing(false);
    
    // Refetch caregivers to update the UI immediately
    setTimeout(() => refetch(), 500);
  };

  const privacyOptions = [
    { value: "emergency", label: "Emergency only", desc: "Only notify during high-risk situations" },
    { value: "daily", label: "Daily summary", desc: "Send a daily summary of routine and health" },
    { value: "meds", label: "Medications only", desc: "Only notify about medication adherence" },
    { value: "custom", label: "Custom", desc: "Choose what to share" },
  ];

  const simulateAlert = () => {
    setShowAlert(true);
    toast({ title: "Alert simulated", description: "High-risk alert notification previewed" });
  };

  // Load existing caregiver data when available
  useEffect(() => {
    if (existingCaregiver && !isEditing) {
      setCaregiverName(existingCaregiver.name || "");
      setCaregiverEmail(existingCaregiver.email || "");
      setCaregiverRelation(existingCaregiver.relationship || "");
      setPrivacyLevel(existingCaregiver.notificationPreferences?.level || "daily");
    }
    
    // Load health goals from localStorage
    const savedGoals = localStorage.getItem("caregiverHealthGoals");
    if (savedGoals) {
      try {
        setHealthGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error("Failed to parse health goals:", e);
      }
    }
  }, [existingCaregiver, isEditing]);

  const handleSaveHealthGoals = () => {
    // Save to localStorage
    localStorage.setItem("caregiverHealthGoals", JSON.stringify(healthGoals));
    
    // Also sync with nutrition goals in settings
    localStorage.setItem("nutritionGoals", JSON.stringify({
      calories: healthGoals.calories,
      protein: healthGoals.protein,
      carbs: healthGoals.carbs,
      fat: healthGoals.fat,
    }));
    
    toast({
      title: "Health goals saved",
      description: "Goals have been set for your loved one.",
    });
  };

  const generateShareableLink = async () => {
    try {
      // Generate token via API
      const response = await fetch('/api/caregiver/generate-token', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate token');
      }
      
      const { token } = await response.json();
      
      // Get the correct base URL
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/caregiver-portal?token=${token}`;
      setShareableLink(link);
      
      return link;
    } catch (error) {
      console.error('Generate link error:', error);
      toast({
        title: "Error generating link",
        description: "Please try again later.",
        variant: "destructive",
      });
      return "";
    }
  };

  const copyShareableLink = async () => {
    const link = shareableLink || await generateShareableLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setShowLinkCopied(true);
      setTimeout(() => setShowLinkCopied(false), 3000);
      toast({
        title: "Link copied!",
        description: "Share this link with your caregiver so they can set health goals remotely.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-caregiver-title">Caregiver</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage caregiver access and alerts</p>
      </div>

      <Card className="card-elevated" data-testid="card-caregiver-info">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4" /> Caregiver Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input 
              value={caregiverName} 
              onChange={e => {
                setCaregiverName(e.target.value);
                setIsEditing(true);
              }} 
              className="text-sm" 
              data-testid="input-cg-name" 
              placeholder="Enter caregiver name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input 
              type="email"
              value={caregiverEmail} 
              onChange={e => {
                setCaregiverEmail(e.target.value);
                setIsEditing(true);
              }} 
              className="text-sm" 
              data-testid="input-cg-email" 
              placeholder="caregiver@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Relation</Label>
            <Input 
              value={caregiverRelation} 
              onChange={e => {
                setCaregiverRelation(e.target.value);
                setIsEditing(true);
              }} 
              className="text-sm" 
              data-testid="input-cg-relation" 
              placeholder="e.g., Daughter, Son, Spouse"
            />
          </div>
          <Button 
            size="sm" 
            data-testid="button-save-caregiver" 
            onClick={handleSave}
            disabled={createCaregiver.isPending}
          >
            {createCaregiver.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
            Save
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-privacy">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={privacyLevel} onValueChange={setPrivacyLevel} className="space-y-3">
            {privacyOptions.map(opt => (
              <div key={opt.value} className="flex items-start gap-3 rounded-xl p-3 -mx-3 transition-colors hover:bg-muted/50">
                <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" data-testid={`radio-privacy-${opt.value}`} />
                <label htmlFor={opt.value} className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-summary-preview">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Caregiver Summary Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-1">
              <span className="font-medium">Daily Summary for {caregiverName}</span>
              <Badge variant="secondary" className="text-xs no-default-active-elevate">Preview</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Medications: 2 of 5 taken (40% adherence today)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Routine: Moderate drift detected - lunch delayed</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Activity: Morning walk completed, currently resting</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Symptoms: Dizziness reported (severity 2/5)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-send-update">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4" /> Send Progress Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Share your health progress with your caregiver. They'll receive a summary of your medications, meals, and activities.
          </p>
          
          {sendUpdate.isSuccess && sendUpdate.data && (
            <div className="animate-slide-up rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Update Sent!</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-emerald-700 dark:text-emerald-300">
                  {sendUpdate.data.message || `Sent to ${sendUpdate.data.recipientCount} caregiver(s)`}
                </p>
                {sendUpdate.data.recipients && sendUpdate.data.recipients.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Recipients:</p>
                    {sendUpdate.data.recipients.map((recipient: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <User className="w-3 h-3" />
                        <span>{recipient.name} ({recipient.relationship}) - {recipient.email}</span>
                      </div>
                    ))}
                  </div>
                )}
                {sendUpdate.data.update && (
                  <div className="mt-3 p-3 rounded-md bg-white/60 dark:bg-black/20 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Message Preview:</p>
                    <p className="text-xs">{sendUpdate.data.update.mainMessage}</p>
                    {sendUpdate.data.update.details && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>• {sendUpdate.data.update.details.medications}</p>
                        <p>• {sendUpdate.data.update.details.meals}</p>
                        <p>• {sendUpdate.data.update.details.activities}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => sendUpdate.mutateAsync({})} 
            disabled={sendUpdate.isPending || (!existingCaregiver && !caregiverEmail)}
            data-testid="button-send-update"
            className="w-full"
          >
            {sendUpdate.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Send Update to {caregiverName || "Caregiver"}
              </>
            )}
          </Button>
          {!existingCaregiver && !caregiverEmail && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Please add a caregiver contact first to send updates.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Health Goals Card - For Caregivers to Set */}
      <Card className="card-elevated bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800" data-testid="card-health-goals">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" /> Set Health Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3 space-y-2">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
              👥 Share with Caregiver
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Generate a secure link that your caregiver can use to set your health goals remotely. They won't need to log in or access your account.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={copyShareableLink}
                className="flex-1"
              >
                {showLinkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 mr-1" />
                    Copy Caregiver Link
                  </>
                )}
              </Button>
            </div>
            {shareableLink && (
              <div className="mt-2 p-2 rounded bg-white dark:bg-black/20 text-xs break-all text-muted-foreground">
                {shareableLink}
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-3">
              Or set goals directly here:
            </p>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-calories" className="text-xs font-medium">
                  Daily Calories (kcal)
                </Label>
                <Input
                  id="goal-calories"
                  type="number"
                  value={healthGoals.calories}
                  onChange={(e) => setHealthGoals({ ...healthGoals, calories: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="goal-protein" className="text-xs font-medium">
                    Protein (g)
                  </Label>
                  <Input
                    id="goal-protein"
                    type="number"
                    value={healthGoals.protein}
                    onChange={(e) => setHealthGoals({ ...healthGoals, protein: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="goal-carbs" className="text-xs font-medium">
                    Carbs (g)
                  </Label>
                  <Input
                    id="goal-carbs"
                    type="number"
                    value={healthGoals.carbs}
                    onChange={(e) => setHealthGoals({ ...healthGoals, carbs: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="goal-fat" className="text-xs font-medium">
                    Fat (g)
                  </Label>
                  <Input
                    id="goal-fat"
                    type="number"
                    value={healthGoals.fat}
                    onChange={(e) => setHealthGoals({ ...healthGoals, fat: parseInt(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal-exercise" className="text-xs font-medium">
                  Daily Exercise (minutes)
                </Label>
                <Input
                  id="goal-exercise"
                  type="number"
                  value={healthGoals.exerciseMinutes}
                  onChange={(e) => setHealthGoals({ ...healthGoals, exerciseMinutes: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveHealthGoals}
              className="w-full mt-3"
              data-testid="button-save-health-goals"
            >
              <Check className="w-4 h-4 mr-1" />
              Save Health Goals
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-alert-simulation">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Alert Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Test how a high-risk alert would appear to your caregiver.</p>
          <Button variant="destructive" onClick={simulateAlert} data-testid="button-simulate-alert">
            Simulate High-Risk Alert
          </Button>
          {showAlert && (
            <div className="animate-scale-in rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 space-y-2 shadow-sm" data-testid="card-alert-preview">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-sm text-red-800 dark:text-red-300">High-Risk Alert</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                User reported severe dizziness (5/5) and has missed 2 medications today. Lunch has been delayed by 3 hours.
              </p>
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <Phone className="w-3.5 h-3.5" />
                <span>Notification sent to {caregiverName || "caregiver"} at {caregiverEmail || "email"}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => setShowAlert(false)}>Dismiss</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
