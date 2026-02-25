import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Check, Shield, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CaregiverPortal() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Get token from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  
  const [healthGoals, setHealthGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    exerciseMinutes: 30,
  });
  
  const [isValidToken, setIsValidToken] = useState(false);
  const [patientName, setPatientName] = useState("your loved one");

  useEffect(() => {
    // Validate token (in a real app, this would be a server call)
    if (token) {
      setIsValidToken(true);
      // In a real implementation, fetch patient info from server
      // For now, we'll use localStorage as a simple demo
      try {
        const decoded = atob(token);
        setPatientName("Patient"); // Would come from server
      } catch (e) {
        setIsValidToken(false);
      }
    }
  }, [token]);

  const handleSaveGoals = async () => {
    if (!token) return;
    
    try {
      // Save via API
      const response = await fetch(`/api/caregiver/health-goals/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(healthGoals),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save goals');
      }
      
      const data = await response.json();
      
      toast({
        title: "Goals saved successfully!",
        description: `Health goals have been set for ${patientName}.`,
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

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-red-500" />
            <h2 className="text-xl font-bold">Invalid Access Link</h2>
            <p className="text-sm text-muted-foreground">
              This caregiver portal link is invalid or has expired. Please request a new link from your loved one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <div className="text-center space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold">Caregiver Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Set health goals for {patientName}
          </p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Daily Health Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set daily health targets to help monitor and support your loved one's wellbeing. These goals will be used to track their progress.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="portal-calories" className="text-sm font-medium">
                  Daily Calories (kcal)
                </Label>
                <Input
                  id="portal-calories"
                  type="number"
                  value={healthGoals.calories}
                  onChange={(e) => setHealthGoals({ ...healthGoals, calories: parseInt(e.target.value) || 0 })}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1600-2400 kcal for older adults
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="portal-protein" className="text-sm font-medium">
                    Protein (g)
                  </Label>
                  <Input
                    id="portal-protein"
                    type="number"
                    value={healthGoals.protein}
                    onChange={(e) => setHealthGoals({ ...healthGoals, protein: parseInt(e.target.value) || 0 })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="portal-carbs" className="text-sm font-medium">
                    Carbs (g)
                  </Label>
                  <Input
                    id="portal-carbs"
                    type="number"
                    value={healthGoals.carbs}
                    onChange={(e) => setHealthGoals({ ...healthGoals, carbs: parseInt(e.target.value) || 0 })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="portal-fat" className="text-sm font-medium">
                    Fat (g)
                  </Label>
                  <Input
                    id="portal-fat"
                    type="number"
                    value={healthGoals.fat}
                    onChange={(e) => setHealthGoals({ ...healthGoals, fat: parseInt(e.target.value) || 0 })}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="portal-exercise" className="text-sm font-medium">
                  Daily Exercise (minutes)
                </Label>
                <Input
                  id="portal-exercise"
                  type="number"
                  value={healthGoals.exerciseMinutes}
                  onChange={(e) => setHealthGoals({ ...healthGoals, exerciseMinutes: parseInt(e.target.value) || 0 })}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 20-30 minutes of light activity daily
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveGoals}
              className="w-full"
              size="lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Health Goals
            </Button>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">🔒 Secure & Private</p>
              <p>
                These goals are saved securely and will only be used to help track your loved one's health progress. You can update them anytime using this link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
