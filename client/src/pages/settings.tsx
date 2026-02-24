import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Type,
  Eye,
  MessageSquare,
  MousePointer,
  Volume2,
  RefreshCw,
  Check,
  Zap,
  User,
  Loader2,
  Bell,
  BellOff,
  Download,
  FileText,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAccessibility } from "@/lib/accessibility-provider";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser, useUpdateUserProfile } from "@/hooks/use-api";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api-client";

const languages = [
  "English",
  "Spanish (Español)",
  "French (Français)",
  "German (Deutsch)",
  "Italian (Italiano)",
  "Portuguese (Português)",
  "Russian (Русский)",
  "Mandarin (中文)",
  "Japanese (日本語)",
  "Korean (한국어)",
  "Arabic (العربية)",
  "Hindi (हिन्दी)",
  "Bengali (বাংলা)",
  "Tamil (தமிழ்)",
  "Telugu (తెలుగు)",
  "Marathi (मराठी)",
  "Gujarati (ગુજરાતી)",
  "Kannada (ಕನ್ನಡ)",
  "Malayalam (മലയാളം)",
  "Punjabi (ਪੰਜਾਬੀ)",
];
const ageGroups = ["18-24", "25-34", "35-44", "45-54", "55-64", "65-74", "75+"];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const a11y = useAccessibility();
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const updateProfile = useUpdateUserProfile();
  const pushNotifications = usePushNotifications();
  const queryClient = useQueryClient();

  // User profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    ageGroup: "65-74",
    language: "English",
    location: "",
  });

  // Health data export state
  const [exportDays, setExportDays] = useState("30");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [isExporting, setIsExporting] = useState(false);

  // Load user profile from API
  useEffect(() => {
    if (userData?.user) {
      setProfile({
        name: userData.user.name || "",
        ageGroup: userData.user.ageGroup || "65-74",
        language: userData.user.language || "English",
        location: userData.user.location || "",
      });
    } else if ((userData as any)?.name) {
      // Handle direct user object format
      setProfile({
        name: (userData as any).name || "",
        ageGroup: (userData as any).ageGroup || "65-74",
        language: (userData as any).language || "English",
        location: (userData as any).location || "",
      });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync(profile);
    setIsEditingProfile(false);
  };

  const handleExportHealthData = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportHealthData(parseInt(exportDays));
      
      if (exportFormat === "excel") {
        // Create CSV format (Excel compatible)
        let csv = "SahAI Health Data Export\n";
        csv += `Patient: ${data.patient.name}\n`;
        csv += `Age Group: ${data.patient.ageGroup}\n`;
        csv += `Export Date: ${new Date(data.patient.exportDate).toLocaleString()}\n`;
        csv += `Data Range: ${new Date(data.patient.dataRange.from).toLocaleDateString()} to ${new Date(data.patient.dataRange.to).toLocaleDateString()} (${data.patient.dataRange.days} days)\n\n`;
        
        // Medications
        csv += "ACTIVE MEDICATIONS\n";
        csv += "Name,Dosage,Frequency,Instructions\n";
        data.medications.active.forEach((med: any) => {
          csv += `"${med.name}","${med.dosage}","${med.frequency}","${med.instructions || ''}"\n`;
        });
        csv += "\n";
        
        // Meals
        csv += "MEALS LOG\n";
        csv += "Date,Time,Meal Type,Foods,Calories\n";
        data.meals.forEach((meal: any) => {
          const date = new Date(meal.loggedAt);
          csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${meal.mealType}","${meal.foods}","${meal.estimatedCalories || 'N/A'}"\n`;
        });
        csv += "\n";
        
        // Vitals
        csv += "VITALS READINGS\n";
        csv += "Date,Time,Type,Value,Unit\n";
        data.vitals.forEach((vital: any) => {
          const date = new Date(vital.recordedAt);
          csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${vital.vitalType}","${vital.value}","${vital.unit}"\n`;
        });
        csv += "\n";
        
        // Symptoms
        csv += "SYMPTOMS LOG\n";
        csv += "Date,Time,Symptom,Severity (1-5),Notes\n";
        data.symptoms.forEach((symptom: any) => {
          const date = new Date(symptom.loggedAt);
          csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${symptom.symptom}","${symptom.severity}","${symptom.notes || ''}"\n`;
        });
        csv += "\n";
        
        // Activities
        csv += "ACTIVITIES LOG\n";
        csv += "Date,Time,Activity,Notes\n";
        data.activities.forEach((activity: any) => {
          const date = new Date(activity.loggedAt);
          csv += `"${date.toLocaleDateString()}","${date.toLocaleTimeString()}","${activity.activityType}","${activity.notes || ''}"\n`;
        });
        
        // Download CSV
        const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement("a");
        csvLink.href = csvUrl;
        csvLink.download = `health-data-${data.patient.name.replace(/\s+/g, "-")}-${exportDays}days-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
      } else {
        // Create HTML for PDF (user can print to PDF)
        let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Health Data Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    .header { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .header p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #2563eb; color: white; padding: 10px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9fafb; }
    .summary { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>🏥 SahAI Health Data Report</h1>
  
  <div class="header">
    <p><strong>Patient Name:</strong> ${data.patient.name}</p>
    <p><strong>Age Group:</strong> ${data.patient.ageGroup}</p>
    <p><strong>Report Generated:</strong> ${new Date(data.patient.exportDate).toLocaleString()}</p>
    <p><strong>Data Period:</strong> ${new Date(data.patient.dataRange.from).toLocaleDateString()} to ${new Date(data.patient.dataRange.to).toLocaleDateString()} (${data.patient.dataRange.days} days)</p>
  </div>

  <div class="summary">
    <h3>📊 Summary</h3>
    <p>Active Medications: ${data.summary.totalActiveMedications} | Meals Logged: ${data.summary.totalMeals} | Vitals Readings: ${data.summary.totalVitals} | Symptoms Reported: ${data.summary.totalSymptoms} | Activities: ${data.summary.totalActivities}</p>
  </div>

  <h2>💊 Active Medications</h2>
  <table>
    <thead>
      <tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Instructions</th></tr>
    </thead>
    <tbody>
      ${data.medications.active.map((med: any) => `
        <tr>
          <td>${med.name}</td>
          <td>${med.dosage}</td>
          <td>${med.frequency}</td>
          <td>${med.instructions || '-'}</td>
        </tr>
      `).join('')}
      ${data.medications.active.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No active medications</td></tr>' : ''}
    </tbody>
  </table>

  <h2>🍽️ Meals Log</h2>
  <table>
    <thead>
      <tr><th>Date</th><th>Time</th><th>Meal Type</th><th>Foods</th><th>Calories</th></tr>
    </thead>
    <tbody>
      ${data.meals.map((meal: any) => {
        const date = new Date(meal.loggedAt);
        return `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${meal.mealType}</td>
          <td>${meal.foods}</td>
          <td>${meal.estimatedCalories || 'N/A'}</td>
        </tr>
      `}).join('')}
      ${data.meals.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No meals logged</td></tr>' : ''}
    </tbody>
  </table>

  <h2>❤️ Vitals Readings</h2>
  <table>
    <thead>
      <tr><th>Date</th><th>Time</th><th>Type</th><th>Value</th><th>Unit</th></tr>
    </thead>
    <tbody>
      ${data.vitals.map((vital: any) => {
        const date = new Date(vital.recordedAt);
        return `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${vital.vitalType}</td>
          <td>${vital.value}</td>
          <td>${vital.unit}</td>
        </tr>
      `}).join('')}
      ${data.vitals.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No vitals recorded</td></tr>' : ''}
    </tbody>
  </table>

  <h2>📝 Symptoms Log</h2>
  <table>
    <thead>
      <tr><th>Date</th><th>Time</th><th>Symptom</th><th>Severity</th><th>Notes</th></tr>
    </thead>
    <tbody>
      ${data.symptoms.map((symptom: any) => {
        const date = new Date(symptom.loggedAt);
        return `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${symptom.symptom}</td>
          <td>${symptom.severity}/5</td>
          <td>${symptom.notes || '-'}</td>
        </tr>
      `}).join('')}
      ${data.symptoms.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No symptoms reported</td></tr>' : ''}
    </tbody>
  </table>

  <h2>🚶 Activities Log</h2>
  <table>
    <thead>
      <tr><th>Date</th><th>Time</th><th>Activity</th><th>Notes</th></tr>
    </thead>
    <tbody>
      ${data.activities.map((activity: any) => {
        const date = new Date(activity.loggedAt);
        return `
        <tr>
          <td>${date.toLocaleDateString()}</td>
          <td>${date.toLocaleTimeString()}</td>
          <td>${activity.activityType}</td>
          <td>${activity.notes || '-'}</td>
        </tr>
      `}).join('')}
      ${data.activities.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No activities logged</td></tr>' : ''}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by SahAI - Your AI Health Companion</p>
    <p class="no-print">To save as PDF: Press Ctrl+P (Windows) or Cmd+P (Mac) and select "Save as PDF"</p>
  </div>

  <script>
    // Auto-print dialog
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
        `;
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
        }
      }

      toast({
        title: exportFormat === "excel" ? "Excel file downloaded" : "PDF ready to print",
        description: exportFormat === "excel" 
          ? `Downloaded ${exportDays} days of health data as CSV (Excel compatible).`
          : `Print dialog opened. Select "Save as PDF" to save the report.`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export health data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your SahAI experience</p>
      </div>

      {/* User Profile Section */}
      <Card className="card-elevated" data-testid="card-profile">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" /> User Profile
            </CardTitle>
            {!isEditingProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                data-testid="button-edit-profile"
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Name</Label>
            {isEditingProfile ? (
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your name"
                data-testid="input-name"
              />
            ) : (
              <p className="text-sm font-medium">{profile.name || "Not set"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup" className="text-sm">Age Group</Label>
            {isEditingProfile ? (
              <Select
                value={profile.ageGroup}
                onValueChange={(value) => setProfile({ ...profile, ageGroup: value })}
              >
                <SelectTrigger id="ageGroup" data-testid="select-age-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((age) => (
                    <SelectItem key={age} value={age}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">{profile.ageGroup}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm">Preferred Language</Label>
            {isEditingProfile ? (
              <Select
                value={profile.language}
                onValueChange={(value) => setProfile({ ...profile, language: value })}
              >
                <SelectTrigger id="language" data-testid="select-profile-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">{profile.language}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm">Location (City)</Label>
            {isEditingProfile ? (
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                data-testid="input-location"
              />
            ) : (
              <p className="text-sm font-medium">{profile.location || "Auto-detect (GPS)"}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {isEditingProfile 
                ? "Leave empty to use GPS location automatically" 
                : profile.location 
                  ? "Weather will be shown for this location" 
                  : "Using GPS to detect your location"}
            </p>
          </div>

          {isEditingProfile && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending}
                data-testid="button-save-profile"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsEditingProfile(false)}
                disabled={updateProfile.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-theme">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sun className="w-4 h-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(opt => (
              <Button
                key={opt.value}
                variant={theme === opt.value ? "default" : "secondary"}
                className="h-auto py-3.5 flex-col gap-1.5 rounded-xl active:scale-[0.97]"
                onClick={() => setTheme(opt.value)}
                data-testid={`button-theme-${opt.value}`}
              >
                <opt.icon className="w-4 h-4" />
                <span className="text-xs">{opt.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-accessibility">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" /> Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "largeText" as const, label: "Large text", desc: "Increase text size throughout the app", icon: Type },
            { key: "highContrast" as const, label: "High contrast", desc: "Increase contrast for better visibility", icon: Eye },
            { key: "simpleLanguage" as const, label: "Simple language", desc: "Use simpler words and shorter sentences", icon: MessageSquare },
            { key: "bigButtons" as const, label: "Big buttons", desc: "Increase button sizes for easier tapping", icon: MousePointer },
          ].map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
              <Switch
                checked={a11y[key]}
                onCheckedChange={v => a11y.updateSetting(key, v)}
                data-testid={`switch-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-notifications">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {pushNotifications.isSubscribed ? (
                <Bell className="w-4 h-4 text-primary mt-0.5" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground mt-0.5" />
              )}
              <div>
                <Label className="text-sm font-medium">
                  {pushNotifications.isSubscribed ? "Notifications enabled" : "Enable notifications"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pushNotifications.isSubscribed 
                    ? "You'll receive reminders for medications and health updates"
                    : "Get reminders for medications, meals, and health alerts"}
                </p>
              </div>
            </div>
            {pushNotifications.isSupported ? (
              <Switch
                checked={pushNotifications.isSubscribed}
                onCheckedChange={v => v ? pushNotifications.subscribe() : pushNotifications.unsubscribe()}
                disabled={pushNotifications.isLoading}
                data-testid="switch-notifications"
              />
            ) : (
              <p className="text-xs text-muted-foreground">Not supported</p>
            )}
          </div>
          {pushNotifications.isSubscribed && (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                ✓ You'll receive notifications for medication reminders, health alerts, and caregiver updates
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-voice-settings">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Volume2 className="w-4 h-4" /> Voice & Speech
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "readAloud" as const, label: "Read aloud", desc: "SahAI reads responses out loud" },
            { key: "slowerSpeech" as const, label: "Slower speech", desc: "SahAI speaks more slowly" },
            { key: "voiceFirst" as const, label: "Voice-first mode", desc: "Prioritize voice interaction" },
            { key: "teachBack" as const, label: "Teach-back mode", desc: "SahAI confirms you understood" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch
                checked={a11y[key]}
                onCheckedChange={v => a11y.updateSetting(key, v)}
                data-testid={`switch-${key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="card-elevated" data-testid="card-export-data">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Download Health Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export your health data to share with your doctor or for your records.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="exportFormat" className="text-sm">Export Format</Label>
            <Select value={exportFormat} onValueChange={(v: "pdf" | "excel") => setExportFormat(v)}>
              <SelectTrigger id="exportFormat" data-testid="select-export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (Printable Report)</SelectItem>
                <SelectItem value="excel">Excel (CSV File)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exportDays" className="text-sm">Data Range</Label>
            <Select value={exportDays} onValueChange={setExportDays}>
              <SelectTrigger id="exportDays" data-testid="select-export-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 p-3">
            <p className="text-xs text-sky-700 dark:text-sky-300">
              <strong>Includes:</strong> Medications, meals, vitals, symptoms, and activities from the selected time period
            </p>
          </div>

          <Button
            onClick={handleExportHealthData}
            disabled={isExporting}
            className="w-full"
            data-testid="button-export-data"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download as {exportFormat === "pdf" ? "PDF" : "Excel"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => { a11y.resetAll(); toast({ title: "Settings reset", description: "All accessibility settings have been reset to defaults." }); }}
          data-testid="button-reset"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Reset All
        
        </Button>
      </div>
    </div>
  );
}
