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
  const { data: caregivers, isLoading } = useCaregivers();
  const createCaregiver = useCreateCaregiver();
  const sendUpdate = useSendCaregiverUpdate();
  
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [caregiverRelation, setCaregiverRelation] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("daily");
  const [showAlert, setShowAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing caregiver data
  const existingCaregiver = caregivers?.[0];
  
  const handleSave = async () => {
    if (!caregiverName || !caregiverPhone) {
      toast({
        title: "Missing information",
        description: "Please fill in name and phone number",
        variant: "destructive",
      });
      return;
    }

    await createCaregiver.mutateAsync({
      name: caregiverName,
      phone: caregiverPhone,
      relationship: caregiverRelation,
      notificationPreferences: {
        level: privacyLevel,
      },
    });
    setIsEditing(false);
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
      setCaregiverPhone(existingCaregiver.phone || "");
      setCaregiverRelation(existingCaregiver.relationship || "");
      setPrivacyLevel(existingCaregiver.notificationPreferences?.level || "daily");
    }
  }, [existingCaregiver, isEditing]);

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
            <Label className="text-xs">Phone</Label>
            <Input 
              value={caregiverPhone} 
              onChange={e => {
                setCaregiverPhone(e.target.value);
                setIsEditing(true);
              }} 
              className="text-sm" 
              data-testid="input-cg-phone" 
              placeholder="+91 XXXXX XXXXX"
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
          <Button 
            onClick={() => sendUpdate.mutateAsync({})} 
            disabled={sendUpdate.isPending || !existingCaregiver}
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
          {!existingCaregiver && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Please add a caregiver contact first to send updates.
            </p>
          )}
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
                <span>Notification sent to {caregiverName || "caregiver"} at {caregiverPhone || "phone"}</span>
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
