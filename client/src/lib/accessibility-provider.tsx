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
    root.classList.toggle("large-text-mode", settings.largeText);
    root.classList.toggle("high-contrast-mode", settings.highContrast);
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetAll = () => setSettings(defaults);

  return (
    <AccessibilityContext.Provider value={{ ...settings, updateSetting, resetAll }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
