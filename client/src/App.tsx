import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AccessibilityProvider } from "@/lib/accessibility-provider";
import { AppLayout } from "@/components/app-layout";
import { useState, useEffect } from "react";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import Medications from "@/pages/medications";
import Meals from "@/pages/meals";
import Symptoms from "@/pages/symptoms";
import Voice from "@/pages/voice";
import Caregiver from "@/pages/caregiver";
import Insights from "@/pages/insights";
import Settings from "@/pages/settings";
import Exercise from "@/pages/exercise";
import Vitals from "@/pages/vitals";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const [location] = useLocation();
  const [authenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem("sahai-authenticated") === "true";
  });
  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem("sahai-onboarded") === "true";
  });

  useEffect(() => {
    const check = () => {
      setAuthenticated(localStorage.getItem("sahai-authenticated") === "true");
      setOnboarded(localStorage.getItem("sahai-onboarded") === "true");
    };
    window.addEventListener("storage", check);
    const interval = setInterval(check, 500);
    return () => { window.removeEventListener("storage", check); clearInterval(interval); };
  }, []);

  // Public routes (no auth required)
  if (location === "/landing" || location === "/login" || location === "/register") {
    return (
      <Switch>
        <Route path="/landing" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
      </Switch>
    );
  }

  // Redirect to landing if not authenticated
  if (!authenticated) {
    return <Landing />;
  }

  // Redirect to onboarding if not onboarded
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
        <Route path="/exercise" component={Exercise} />
        <Route path="/vitals" component={Vitals} />
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
