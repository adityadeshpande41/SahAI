# AI Learning Features Implementation

## Overview
Implemented personalized learning features that make the app smarter over time by analyzing user behavior patterns and providing intelligent suggestions.

## Features Implemented

### 1. Dietary Preferences Learning
- **What it does**: Tracks which foods users log most frequently
- **How it works**: Analyzes last 30 days of meal logs, counts food frequency
- **User benefit**: See your favorite foods and get personalized meal suggestions
- **API**: `GET /api/insights/preferences`

### 2. Optimal Medication Timing
- **What it does**: Learns when users actually take their medications
- **How it works**: Analyzes historical medication logs to find patterns
- **User benefit**: Get suggestions for better medication scheduling based on your actual habits
- **API**: `GET /api/insights/medication-timing/:medicationName`

### 3. Meal Suggestions
- **What it does**: Suggests meals based on time of day and user preferences
- **How it works**: Combines current time, favorite foods, and meal history
- **User benefit**: Get personalized meal ideas when it's time to eat
- **API**: `GET /api/insights/meal-suggestion`

### 4. Symptom Prediction
- **What it does**: Predicts potential health risks based on current behavior
- **How it works**: Analyzes patterns like skipped meals, missed medications, and past symptoms
- **User benefit**: Get early warnings about potential issues (e.g., "You usually get dizzy when you skip lunch")
- **API**: `GET /api/insights/symptom-prediction`

### 5. Activity Suggestions
- **What it does**: Suggests activities based on time of day and past preferences
- **How it works**: Learns when users typically do certain activities
- **User benefit**: Get reminded of activities you usually do at this time
- **API**: `GET /api/insights/activity-suggestion`

## Technical Implementation

### New Files Created
1. **`server/agents/learning-agent.ts`** - Core learning logic
   - Analyzes user preferences from historical data
   - Provides intelligent suggestions
   - Predicts health risks

2. **Enhanced `client/src/pages/insights.tsx`** - UI for learning features
   - AI Learning Insights card with personalized recommendations
   - Displays symptom predictions, meal suggestions, activity suggestions
   - Shows favorite foods and patterns

### API Routes Added
```
GET /api/insights/preferences           - Get all user preferences
GET /api/insights/meal-suggestion       - Get meal suggestion for current time
GET /api/insights/medication-timing/:name - Get optimal timing for medication
GET /api/insights/symptom-prediction    - Get health risk prediction
GET /api/insights/activity-suggestion   - Get activity suggestions
```

### Frontend Hooks Added
- `useUserPreferences()` - Fetch user preferences
- `useMealSuggestion()` - Get meal suggestions (refreshes hourly)
- `useSymptomPrediction()` - Get symptom predictions (refreshes every 30 min)
- `useActivitySuggestion()` - Get activity suggestions (refreshes hourly)
- `useMedicationTiming()` - Get optimal medication timing

## How It Learns

### Data Sources
- **Meal logs** (last 30 days) → Food preferences, eating patterns
- **Medication schedules** (last 30 days) → Adherence patterns, optimal times
- **Symptom logs** (last 14-30 days) → Symptom triggers, patterns
- **Activity logs** (last 30 days) → Activity preferences, timing

### Learning Algorithms
1. **Frequency Analysis**: Counts occurrences to find favorites
2. **Median Calculation**: Finds typical times for activities/medications
3. **Pattern Detection**: Identifies correlations (e.g., skipped meal → dizziness)
4. **Trigger Extraction**: Analyzes notes to find symptom triggers

## User Experience

### Insights Page
Users will see a new "AI Learning Insights" card at the top of the Insights page with:
- ✅ Health status with risk predictions
- 🍽️ Personalized meal suggestions
- 🏃 Activity recommendations based on routine
- ⭐ Favorite foods tracker
- 💊 Medication adherence insights

### Smart Notifications
The system can now:
- Warn about potential symptoms before they occur
- Suggest meals at appropriate times
- Remind about activities based on routine
- Recommend better medication schedules

## Privacy & Data
- All learning happens on your server
- No data is sent to external services
- Uses only the user's own historical data
- Can be disabled if desired

## Future Enhancements (Not Yet Implemented)
- Sleep pattern tracking and optimization
- Emotional state/mood tracking
- Correlation analysis (find relationships between meals, meds, symptoms)
- ML-based anomaly detection
- Predictive analytics with confidence scores
- Personalized health goals based on patterns

## Testing
To test the features:
1. Navigate to the Insights page
2. Log meals, medications, and activities for a few days
3. The AI will start showing personalized insights
4. The more data logged, the better the suggestions become

## Performance
- Queries are cached appropriately (5 min to 24 hours depending on data type)
- Historical data queries are limited to 30 days for performance
- Suggestions refresh automatically at optimal intervals
