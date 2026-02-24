import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  simpleLanguage: boolean;
  bigButtons: boolean;
  readAloud: boolean;
  slowerSpeech: boolean;
  teachBack: boolean;
  voiceFirst: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetAll: () => void;
  speechRate: number;
}

const defaults: AccessibilitySettings = {
  largeText: false,
  highContrast: false,
  simpleLanguage: false,
  bigButtons: false,
  readAloud: false,
  slowerSpeech: false,
  teachBack: false,
  voiceFirst: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === "undefined") return defaults;
    const saved = localStorage.getItem("sahai-accessibility");
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  useEffect(() => {
    localStorage.setItem("sahai-accessibility", JSON.stringify(settings));
    const root = document.documentElement;
    
    // Apply large text
    if (settings.largeText) {
      root.style.fontSize = "18px";
    } else {
      root.style.fontSize = "";
    }
    
    // Apply high contrast
    root.classList.toggle("high-contrast-mode", settings.highContrast);
    if (settings.highContrast) {
      root.style.setProperty("--contrast-multiplier", "1.5");
    } else {
      root.style.removeProperty("--contrast-multiplier");
    }
    
    // Apply big buttons
    if (settings.bigButtons) {
      root.style.setProperty("--button-size-multiplier", "1.3");
    } else {
      root.style.removeProperty("--button-size-multiplier");
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetAll = () => setSettings(defaults);

  // Calculate speech rate based on slowerSpeech setting
  const speechRate = settings.slowerSpeech ? 0.75 : 1.0;

  return (
    <AccessibilityContext.Provider value={{ ...settings, updateSetting, resetAll, speechRate }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
