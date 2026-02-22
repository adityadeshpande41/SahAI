import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AccessibilityProvider } from "@/lib/accessibility-provider";
import { AppLayout } from "@/components/app-layout";
import { useState, useEffect } from "react";

import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Medications from "@/pages/medications";
import Meals from "@/pages/meals";
import Symptoms from "@/pages/symptoms";
import Voice from "@/pages/voice";
import Caregiver from "@/pages/caregiver";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const [location] = useLocation();
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem("sahai-onboarded") === "true";
  });

  useEffect(() => {
    const check = () => setOnboarded(localStorage.getItem("sahai-onboarded") === "true");
    window.addEventListener("storage", check);
    const interval = setInterval(check, 500);
    return () => { window.removeEventListener("storage", check); clearInterval(interval); };
  }, []);

  if (!onboarded && location !== "/onboarding") {
    return <Onboarding />;
  }

  if (location === "/onboarding") {
    return <Onboarding />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/medications" component={Medications} />
        <Route path="/meals" component={Meals} />
        <Route path="/symptoms" component={Symptoms} />
        <Route path="/voice" component={Voice} />
        <Route path="/caregiver" component={Caregiver} />
        <Route path="/insights" component={Insights} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AccessibilityProvider>
          <TooltipProvider>
            <Toaster />
            <AppRoutes />
          </TooltipProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
