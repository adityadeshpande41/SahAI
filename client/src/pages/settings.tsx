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
  Languages,
  RefreshCw,
  Check,
  Zap,
  User,
  Loader2,
  Bell,
  BellOff,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAccessibility } from "@/lib/accessibility-provider";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser, useUpdateUserProfile } from "@/hooks/use-api";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useQueryClient } from "@tanstack/react-query";

const languages = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada"];
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

  // Load user profile from API
  useEffect(() => {
    if (userData?.user) {
      setProfile({
        name: userData.user.name || "",
        ageGroup: userData.user.ageGroup || "65-74",
        language: userData.user.language || "English",
        location: userData.user.location || "",
      });
    } else if (userData) {
      // Handle direct user object format
      setProfile({
        name: userData.name || "",
        ageGroup: userData.ageGroup || "65-74",
        language: userData.language || "English",
        location: userData.location || "",
      });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync(profile);
    
    // Invalidate both user and weather cache to fetch fresh data immediately
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.invalidateQueries({ queryKey: ["weather"] });
    
    // Show success message
    toast({
      title: "Profile updated",
      description: profile.location 
        ? `Weather will now show for ${profile.location}` 
        : "Weather will use GPS location",
    });
    
    setIsEditingProfile(false);
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

      <Card className="card-elevated" data-testid="card-language">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Languages className="w-4 h-4" /> Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select defaultValue="English">
            <SelectTrigger data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
