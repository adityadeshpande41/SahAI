import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAccessibility } from "@/lib/accessibility-provider";
import { useToast } from "@/hooks/use-toast";

const languages = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada"];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const a11y = useAccessibility();
  const { toast } = useToast();

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your SahAI experience</p>
      </div>

      <Card data-testid="card-theme">
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
                className="h-auto py-3 flex-col gap-1.5"
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

      <Card data-testid="card-accessibility">
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

      <Card data-testid="card-voice-settings">
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

      <Card data-testid="card-language">
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
