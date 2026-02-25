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

  // Nutrition goals state
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
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

    // Load nutrition goals from API
    fetch('/api/health-goals', { credentials: 'include' })
      .then(res => res.json())
      .then(goals => {
        if (goals && goals.calories) {
          setNutritionGoals({
            calories: goals.calories,
            protein: goals.protein,
            carbs: goals.carbs,
            fat: goals.fat,
          });
        }
      })
      .catch(err => console.error('Failed to load nutrition goals:', err));
  }, [userData]);

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync(profile);
    setIsEditingProfile(false);
  };

  const handleSaveNutritionGoals = async () => {
    try {
      const response = await fetch('/api/health-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nutritionGoals),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save goals');
      }
      
      toast({
        title: "Nutrition goals saved",
        description: "Your daily nutrition targets have been updated.",
      });
    } catch (error) {
      console.error('Save goals error:', error);
      toast({
        title: "Error saving goals",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
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
  <title>Medical Health Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6;
      color: #2c3e50;
      background: #fff;
    }
    .page { 
      max-width: 210mm; 
      margin: 0 auto; 
      padding: 20mm;
      background: white;
    }
    .letterhead {
      border-bottom: 4px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .letterhead h1 {
      color: #0066cc;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .letterhead .subtitle {
      color: #7f8c8d;
      font-size: 14px;
      font-weight: 400;
    }
    .patient-info {
      background: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 20px;
      margin-bottom: 30px;
    }
    .patient-info h2 {
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .info-item {
      display: flex;
      gap: 8px;
    }
    .info-label {
      font-weight: 600;
      color: #34495e;
      min-width: 140px;
    }
    .info-value {
      color: #2c3e50;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card:nth-child(2) { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .summary-card:nth-child(3) { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .summary-card:nth-child(4) { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .summary-card:nth-child(5) { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    .summary-number {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .summary-label {
      font-size: 12px;
      opacity: 0.95;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section-header {
      background: #0066cc;
      color: white;
      padding: 12px 20px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    thead {
      background: #34495e;
      color: white;
    }
    th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:first-child { border-radius: 4px 0 0 0; }
    th:last-child { border-radius: 0 4px 0 0; }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 14px;
    }
    tbody tr:hover {
      background: #f8f9fa;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #95a5a6;
      font-style: italic;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
    .footer-logo {
      font-weight: 600;
      color: #0066cc;
      margin-bottom: 5px;
    }
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .severity-1, .severity-2 { background: #d4edda; color: #155724; }
    .severity-3 { background: #fff3cd; color: #856404; }
    .severity-4, .severity-5 { background: #f8d7da; color: #721c24; }
    @media print {
      body { margin: 0; }
      .page { padding: 15mm; }
      .no-print { display: none; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="letterhead">
      <h1>MEDICAL HEALTH REPORT</h1>
      <div class="subtitle">Comprehensive Health Data Summary</div>
    </div>
    
    <div class="patient-info">
      <h2>Patient Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Patient Name:</span>
          <span class="info-value">${data.patient.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Age Group:</span>
          <span class="info-value">${data.patient.ageGroup}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Report Date:</span>
          <span class="info-value">${new Date(data.patient.exportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Data Period:</span>
          <span class="info-value">${data.patient.dataRange.days} days (${new Date(data.patient.dataRange.from).toLocaleDateString()} - ${new Date(data.patient.dataRange.to).toLocaleDateString()})</span>
        </div>
      </div>
    </div>

    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalActiveMedications}</div>
        <div class="summary-label">Active Medications</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalMeals}</div>
        <div class="summary-label">Meals Logged</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalVitals}</div>
        <div class="summary-label">Vital Readings</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalSymptoms}</div>
        <div class="summary-label">Symptoms</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${data.summary.totalActivities}</div>
        <div class="summary-label">Activities</div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span>💊</span>
        <span>Active Medications</span>
      </div>
      ${data.medications.active.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Medication Name</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${data.medications.active.map((med: any) => `
            <tr>
              <td><strong>${med.name}</strong></td>
              <td>${med.dosage}</td>
              <td>${med.frequency}</td>
              <td>${med.instructions || 'No special instructions'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<div class="empty-state">No active medications recorded</div>'}
    </div>

    <div class="section">
      <div class="section-header">
        <span>🍽️</span>
        <span>Nutrition Log</span>
      </div>
      ${data.meals.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Meal Type</th>
            <th>Foods Consumed</th>
            <th>Calories</th>
          </tr>
        </thead>
        <tbody>
          ${data.meals.slice(0, 50).map((meal: any) => {
            const date = new Date(meal.loggedAt);
            return `
            <tr>
              <td>${date.toLocaleDateString()}</td>
              <td>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td style="text-transform: capitalize;">${meal.mealType}</td>
              <td>${meal.foods}</td>
              <td><strong>${meal.estimatedCalories || 'N/A'}</strong></td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ${data.meals.length > 50 ? `<p style="text-align: center; color: #7f8c8d; font-size: 13px; margin-top: -10px;">Showing first 50 of ${data.meals.length} meals</p>` : ''}
      ` : '<div class="empty-state">No meals logged during this period</div>'}
    </div>

    <div class="section">
      <div class="section-header">
        <span>❤️</span>
        <span>Vital Signs</span>
      </div>
      ${data.vitals.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Vital Type</th>
            <th>Reading</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          ${data.vitals.map((vital: any) => {
            const date = new Date(vital.recordedAt);
            return `
            <tr>
              <td>${date.toLocaleDateString()}</td>
              <td>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td style="text-transform: capitalize;">${vital.vitalType}</td>
              <td><strong>${vital.value}</strong></td>
              <td>${vital.unit}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ` : '<div class="empty-state">No vital signs recorded during this period</div>'}
    </div>

    <div class="section">
      <div class="section-header">
        <span>📝</span>
        <span>Symptoms & Observations</span>
      </div>
      ${data.symptoms.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Symptom</th>
            <th>Severity</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${data.symptoms.map((symptom: any) => {
            const date = new Date(symptom.loggedAt);
            return `
            <tr>
              <td>${date.toLocaleDateString()}</td>
              <td>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td><strong>${symptom.symptom}</strong></td>
              <td><span class="severity-badge severity-${symptom.severity}">${symptom.severity}/5</span></td>
              <td>${symptom.notes || 'No additional notes'}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ` : '<div class="empty-state">No symptoms reported during this period</div>'}
    </div>

    <div class="section">
      <div class="section-header">
        <span>🚶</span>
        <span>Physical Activity</span>
      </div>
      ${data.activities.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Activity Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${data.activities.map((activity: any) => {
            const date = new Date(activity.loggedAt);
            return `
            <tr>
              <td>${date.toLocaleDateString()}</td>
              <td>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td style="text-transform: capitalize;"><strong>${activity.activityType}</strong></td>
              <td>${activity.notes || 'No additional notes'}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ` : '<div class="empty-state">No activities logged during this period</div>'}
    </div>

    <div class="footer">
      <div class="footer-logo">SahAI Health Platform</div>
      <div>This report is generated for informational purposes. Please consult with healthcare professionals for medical advice.</div>
      <div style="margin-top: 10px;">Report ID: ${Date.now().toString(36).toUpperCase()} | Generated: ${new Date().toLocaleString()}</div>
      <div class="no-print" style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
        <strong>To save as PDF:</strong> Press Ctrl+P (Windows) or Cmd+P (Mac), then select "Save as PDF" as the destination.
      </div>
    </div>
  </div>

  <script>
    window.onload = function() { 
      setTimeout(() => window.print(), 500);
    }
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

      {/* Nutrition Goals Card */}
      <Card className="card-elevated" data-testid="card-nutrition-goals">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" /> Nutrition Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Set your daily nutrition targets to track your progress
          </p>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="calories-goal" className="text-xs font-medium">
                Daily Calories (kcal)
              </Label>
              <Input
                id="calories-goal"
                type="number"
                value={nutritionGoals.calories}
                onChange={(e) => setNutritionGoals({ ...nutritionGoals, calories: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="protein-goal" className="text-xs font-medium">
                  Protein (g)
                </Label>
                <Input
                  id="protein-goal"
                  type="number"
                  value={nutritionGoals.protein}
                  onChange={(e) => setNutritionGoals({ ...nutritionGoals, protein: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="carbs-goal" className="text-xs font-medium">
                  Carbs (g)
                </Label>
                <Input
                  id="carbs-goal"
                  type="number"
                  value={nutritionGoals.carbs}
                  onChange={(e) => setNutritionGoals({ ...nutritionGoals, carbs: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fat-goal" className="text-xs font-medium">
                  Fat (g)
                </Label>
                <Input
                  id="fat-goal"
                  type="number"
                  value={nutritionGoals.fat}
                  onChange={(e) => setNutritionGoals({ ...nutritionGoals, fat: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveNutritionGoals}
            className="w-full"
            data-testid="button-save-nutrition-goals"
          >
            <Check className="w-4 h-4 mr-1" />
            Save Nutrition Goals
          </Button>
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
