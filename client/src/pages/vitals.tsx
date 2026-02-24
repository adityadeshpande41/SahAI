import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Droplet,
  Heart,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCreateVital, useTodayVitals, useRecentVitals, useVitalsMotivation } from "@/hooks/use-api";

export default function Vitals() {
  const [bloodSugar, setBloodSugar] = useState("");
  const [measurementType, setMeasurementType] = useState("fasting");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");

  const createVital = useCreateVital();
  const { data: todayBloodSugar } = useTodayVitals("blood_sugar");
  const { data: todayBP } = useTodayVitals("blood_pressure");
  const { data: recentBloodSugar } = useRecentVitals("blood_sugar", 5);
  const { data: recentBP } = useRecentVitals("blood_pressure", 5);
  const { data: vitalsMotivation } = useVitalsMotivation();

  const handleLogBloodSugar = () => {
    if (!bloodSugar) return;
    
    createVital.mutate({
      vitalType: "blood_sugar",
      bloodSugar: parseFloat(bloodSugar),
      measurementType: measurementType as "fasting" | "post_meal" | "random",
      notes,
    });
    
    setBloodSugar("");
    setNotes("");
  };

  const handleLogBloodPressure = () => {
    if (!systolic || !diastolic) return;
    
    createVital.mutate({
      vitalType: "blood_pressure",
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      notes,
    });
    
    setSystolic("");
    setDiastolic("");
    setNotes("");
  };

  const getBloodSugarStatus = (value: number, type: string) => {
    if (type === "fasting") {
      if (value < 70) return { label: "Low", color: "text-blue-600 dark:text-blue-400" };
      if (value <= 100) return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400" };
      if (value <= 125) return { label: "Prediabetes", color: "text-amber-600 dark:text-amber-400" };
      return { label: "High", color: "text-red-600 dark:text-red-400" };
    } else {
      if (value < 70) return { label: "Low", color: "text-blue-600 dark:text-blue-400" };
      if (value <= 140) return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400" };
      if (value <= 199) return { label: "Prediabetes", color: "text-amber-600 dark:text-amber-400" };
      return { label: "High", color: "text-red-600 dark:text-red-400" };
    }
  };

  const getBPStatus = (sys: number, dia: number) => {
    if (sys < 90 || dia < 60) return { label: "Low", color: "text-blue-600 dark:text-blue-400" };
    if (sys < 120 && dia < 80) return { label: "Normal", color: "text-emerald-600 dark:text-emerald-400" };
    if (sys < 130 && dia < 80) return { label: "Elevated", color: "text-amber-600 dark:text-amber-400" };
    if (sys < 140 || dia < 90) return { label: "Stage 1", color: "text-orange-600 dark:text-orange-400" };
    return { label: "Stage 2", color: "text-red-600 dark:text-red-400" };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient">Health Vitals</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your blood sugar and blood pressure</p>
      </div>

      {/* Vitals Motivation Card */}
      {vitalsMotivation?.message && (
        <Card className="card-elevated bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">❤️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 leading-relaxed">
                  {vitalsMotivation.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="blood-sugar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blood-sugar">
            <Droplet className="w-4 h-4 mr-2" />
            Blood Sugar
          </TabsTrigger>
          <TabsTrigger value="blood-pressure">
            <Heart className="w-4 h-4 mr-2" />
            Blood Pressure
          </TabsTrigger>
        </TabsList>

        {/* Blood Sugar Tab */}
        <TabsContent value="blood-sugar" className="space-y-4">
          {/* Log Blood Sugar */}
          <Card className="card-elevated bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Log Blood Sugar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="blood-sugar" className="text-xs">Blood Sugar (mg/dL)</Label>
                  <Input
                    id="blood-sugar"
                    type="number"
                    placeholder="120"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measurement-type" className="text-xs">Measurement Type</Label>
                  <Select value={measurementType} onValueChange={setMeasurementType}>
                    <SelectTrigger id="measurement-type" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fasting">Fasting</SelectItem>
                      <SelectItem value="post_meal">Post Meal</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes-sugar" className="text-xs">Notes (Optional)</Label>
                <Input
                  id="notes-sugar"
                  placeholder="e.g., Before breakfast"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button onClick={handleLogBloodSugar} className="w-full" disabled={!bloodSugar}>
                <Plus className="w-4 h-4 mr-2" />
                Log Blood Sugar
              </Button>
            </CardContent>
          </Card>

          {/* Today's Blood Sugar Summary */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {todayBloodSugar && todayBloodSugar.readings > 0 ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Readings</p>
                    <p className="text-2xl font-bold text-primary">{todayBloodSugar.readings}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(todayBloodSugar.average)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="secondary" className="text-xs">
                      {getBloodSugarStatus(todayBloodSugar.average, "fasting").label}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No readings logged today. Log your first reading above.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Readings */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Readings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentBloodSugar && recentBloodSugar.length > 0 ? (
                recentBloodSugar.map((reading: any, idx: number) => {
                  const status = getBloodSugarStatus(reading.bloodSugar, reading.measurementType);
                  const time = new Date(reading.loggedAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium">{reading.bloodSugar} mg/dL</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {reading.measurementType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{time}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent readings. Start tracking your blood sugar above.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blood Pressure Tab */}
        <TabsContent value="blood-pressure" className="space-y-4">
          {/* Log Blood Pressure */}
          <Card className="card-elevated bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                Log Blood Pressure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="systolic" className="text-xs">Systolic (mmHg)</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic" className="text-xs">Diastolic (mmHg)</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes-bp" className="text-xs">Notes (Optional)</Label>
                <Input
                  id="notes-bp"
                  placeholder="e.g., After morning walk"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button onClick={handleLogBloodPressure} className="w-full" disabled={!systolic || !diastolic}>
                <Plus className="w-4 h-4 mr-2" />
                Log Blood Pressure
              </Button>
            </CardContent>
          </Card>

          {/* Today's BP Summary */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {todayBP && todayBP.readings > 0 ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Readings</p>
                    <p className="text-2xl font-bold text-primary">{todayBP.readings}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(todayBP.avgSystolic)}/{Math.round(todayBP.avgDiastolic)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="secondary" className="text-xs">
                      {getBPStatus(todayBP.avgSystolic, todayBP.avgDiastolic).label}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No readings logged today. Log your first reading above.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Readings */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Readings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentBP && recentBP.length > 0 ? (
                recentBP.map((reading: any, idx: number) => {
                  const status = getBPStatus(reading.systolic, reading.diastolic);
                  const time = new Date(reading.loggedAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-sm font-medium">{reading.systolic}/{reading.diastolic} mmHg</p>
                          <p className="text-xs text-muted-foreground">Blood Pressure</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{time}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent readings. Start tracking your blood pressure above.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
