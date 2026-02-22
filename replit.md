# SahAI - Health Copilot

## Overview
SahAI is a voice-first, accessibility-first health copilot demo app. It helps users track medications, meals, symptoms, and activity with context-aware guidance. This is a frontend-first demo using mock data and local state.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Routing**: Wouter
- **State**: React local state + localStorage
- **Backend**: Express (serving frontend only, no API logic)
- **Build**: Vite

## Project Structure
```
client/src/
  App.tsx           - Main app with routing, providers
  pages/
    dashboard.tsx   - Main twin dashboard (hero screen)
    onboarding.tsx  - Multi-step setup flow
    medications.tsx - Medication tracking
    meals.tsx       - Meal & nutrition tracking
    symptoms.tsx    - Symptom & activity logging
    voice.tsx       - Chat/conversation interface
    caregiver.tsx   - Caregiver management
    insights.tsx    - Summaries & insights
    settings.tsx    - Accessibility & preferences
  components/
    app-layout.tsx  - Responsive layout (sidebar desktop, bottom nav mobile)
    app-sidebar.tsx - Desktop sidebar navigation
    bottom-nav.tsx  - Mobile bottom navigation
  lib/
    mock-data.ts         - All mock data and types
    theme-provider.tsx   - Light/dark theme context
    accessibility-provider.tsx - Accessibility settings context
```

## Key Features
- Onboarding with progress indicator and accessibility preferences
- Dashboard with Routine Twin status, risk guidance, quick actions
- Medication tracking with upload prescription demo
- Meals & nutrition with photo analysis demo
- Symptom & activity logging with pattern insights
- Voice conversation interface with canned demo flows
- Caregiver management with privacy controls and alert simulation
- Insights & summaries with morning briefing and weekly report
- Settings with real-time accessibility adjustments

## Design Tokens
- Primary: Teal (168 hue) for health/trust
- Warm, accessible color palette
- Font: Plus Jakarta Sans
- Dark mode fully supported
- Accessibility modes: large text, high contrast

## Running
- `npm run dev` starts Express + Vite on port 5000
- Onboarding shows on first visit (localStorage flag)
