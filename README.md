# 🏥 SahAI - Your AI-Powered Health Companion

<div align="center">
  <img src="client/public/SahAI.png" alt="SahAI Logo" width="200"/>
  
  **Experience the future of health management with intelligent voice conversations, personalized insights, and proactive care.**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
  
  `#ElevenLabs` `#VibeFlow` `#MultiAgenticAI` `#HealthTech` `#VoiceFirst`
</div>

---

## 🌟 What is SahAI?

SahAI (meaning "companion" in Hindi) is an intelligent health management platform that combines the power of AI with compassionate care. Designed for everyone who values their wellbeing, SahAI helps you track medications, monitor vitals, log meals, and stay connected with caregivers through natural voice conversations.

### 🎯 Key Highlights

- 🗣️ **Voice-First Interface** - Talk naturally in 20+ languages
- 🧠 **Routine Twin AI** - Learns your patterns and detects anomalies
- 📸 **Smart Photo Analysis** - Snap meals or prescriptions for instant insights
- 👨‍👩‍👧 **Family Connection** - Caregivers get real-time updates with privacy control
- 🌍 **Multilingual Support** - English, Hindi, Marathi, Tamil, Telugu, and more
- 🔒 **Privacy-First** - End-to-end encryption and HIPAA-compliant storage
- ♿ **Accessibility-First** - Large text, simple language, voice commands

---

## ✨ Features

### 🤖 AI-Powered Intelligence

#### Routine Twin
Your digital health twin that learns your daily patterns and alerts you to unusual changes before they become problems.

#### Voice Conversations
Natural language processing in 20+ languages with context awareness and memory of your preferences.

#### Smart Photo Analysis
Upload photos of meals or prescriptions. AI extracts nutrition information and medication details automatically.

#### Predictive Analytics
AI analyzes your health data to provide personalized recommendations and early warnings.

### 📊 Health Tracking

- **💊 Medications** - Track prescriptions, set reminders, upload prescriptions with OCR
- **🍽️ Meals** - Log food with photo analysis, track calories and macros
- **❤️ Vitals** - Monitor blood pressure, glucose, heart rate, temperature
- **🤒 Symptoms** - Track symptoms with severity ratings and notes
- **🏃 Exercise** - Log activities and track fitness goals

### 👥 Caregiver Portal

- Generate secure shareable links for family members
- Real-time health summaries and alerts
- Privacy-controlled data sharing
- Remote health goal setting

### 🔔 Smart Notifications

- Context-aware medication reminders
- Meal time notifications
- Unusual pattern alerts
- Customizable notification preferences

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Supabase)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adityadeshpande41/SahAI.git
   cd SahAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   OPENAI_API_KEY=your_openai_api_key
   RESEND_API_KEY=your_resend_api_key
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5001`

---

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Tailwind CSS** + **shadcn/ui** for styling
- **Radix UI** for accessible components

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database management
- **PostgreSQL** for data storage

### AI & Services
- **OpenAI GPT-4** for conversational AI and reasoning
- **OpenAI Whisper** for speech-to-text transcription
- **OpenAI TTS** for text-to-speech synthesis
- **ElevenLabs** for high-quality, natural voice synthesis
- **OpenAI Vision** for image analysis and OCR
- **Resend** for email notifications

---

## 🤖 Multi-Agentic AI Architecture

SahAI's intelligence comes from a sophisticated **multi-agent system** where specialized AI agents collaborate to provide comprehensive health support. Each agent has a specific role and expertise, working together through an orchestration layer.

### Core Architecture

```
User Input → Orchestrator → Specialized Agents → Response Synthesis → User
                ↓
         Context Memory
         Risk Guardrails
         Ambiguity Handler
```

### Specialized AI Agents

#### 🎯 Orchestrator Agent
The central coordinator that routes user requests to appropriate specialized agents based on intent classification. Manages agent communication and response synthesis.

#### 🔍 NLP Parser Agent
**Advanced Natural Language Understanding**
- Extracts structured data from conversational input
- Handles ambiguous queries with context-aware disambiguation
- Supports 20+ languages with cultural nuances
- Identifies entities: medications, foods, symptoms, measurements
- Parses temporal expressions ("yesterday", "last week", "3 days ago")
- Handles colloquial language and medical terminology

**Example Parsing:**
```
Input: "I took my BP med this morning and had dosa for breakfast"
Output: {
  medication: { taken: true, time: "morning", type: "blood pressure" },
  meal: { type: "breakfast", food: "dosa", time: "morning" }
}
```

#### ⚠️ Ambiguity Handler Agent
**Intelligent Clarification System**
- Detects ambiguous or incomplete user inputs
- Generates contextual clarification questions
- Maintains conversation flow while gathering missing information
- Learns from user patterns to reduce future ambiguities

**Example Scenarios:**
- "I took it" → "Which medication did you take?"
- "I'm out" → "Are you going for a walk or traveling?"
- "Feeling weird" → "Can you describe what you're feeling? Any specific symptoms?"

#### 🛡️ Risk Guard Agent
**Proactive Health Safety System**
- Monitors for dangerous medication interactions
- Detects concerning symptom patterns
- Identifies abnormal vital sign readings
- Triggers alerts for emergency situations
- Validates medication dosages against safe ranges
- Flags potential allergic reactions

**Safety Checks:**
- Drug-drug interactions
- Duplicate medication detection
- Dangerous vital sign thresholds
- Symptom severity escalation
- Missed critical medications

#### 💊 Medication Agent
Manages prescriptions, dosages, schedules, and medication adherence tracking with intelligent reminders.

#### 🍽️ Nutrition Agent
Analyzes meals, calculates nutrition, provides dietary recommendations, and tracks macronutrient goals.

#### 🧠 Context Agent
Maintains conversation history, user preferences, and contextual memory across sessions for personalized interactions.

#### 🔄 Routine Twin Agent
**Your Digital Health Twin**
- Learns your daily patterns and routines
- Builds a baseline of normal behavior
- Detects deviations and anomalies
- Predicts potential health issues
- Adapts to lifestyle changes over time

#### 🎓 Learning Agent
Continuously improves from user interactions, feedback, and outcomes to provide better recommendations.

#### 💪 Motivator Agent
Provides encouragement, celebrates achievements, and maintains user engagement with positive reinforcement.

#### 🔮 Future Self Agent
Helps with long-term health planning, goal setting, and visualizing health outcomes.

#### 👨‍👩‍👧 Caregiver Agent
Manages family communication, generates health summaries, and coordinates care with privacy controls.

#### 📊 Summary Agent
Generates comprehensive health reports, insights, and trend analysis for users and healthcare providers.

### Agent Communication Protocol

Agents communicate through a structured message passing system:
1. **Intent Classification** - Orchestrator identifies user intent
2. **Agent Selection** - Routes to appropriate specialized agent(s)
3. **Parallel Processing** - Multiple agents can work simultaneously
4. **Context Sharing** - Agents access shared context and memory
5. **Response Synthesis** - Orchestrator combines agent outputs
6. **Guardrail Validation** - Risk Guard reviews final response
7. **User Delivery** - Natural language response with actions

---

## 🎙️ Voice Technology

### ElevenLabs Integration
SahAI uses **ElevenLabs** for premium voice synthesis, providing:
- Natural, human-like voice quality
- Multilingual support with native accents
- Emotional tone and expression
- Low-latency streaming for real-time conversations
- Customizable voice profiles

### Speech Pipeline
```
User Speech → Whisper STT → NLP Parser → Agent Processing → 
ElevenLabs TTS → Audio Playback
```

**Fallback System:**
- Primary: ElevenLabs for premium quality
- Fallback: OpenAI TTS for reliability
- Browser: Native speech synthesis for offline support

---

## 📱 Screenshots

<div align="center">
  <img src="docs/screenshots/landing.png" alt="Landing Page" width="45%"/>
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="45%"/>
  <img src="docs/screenshots/voice.png" alt="Voice Chat" width="45%"/>
  <img src="docs/screenshots/meals.png" alt="Meals Tracking" width="45%"/>
</div>

---

## 🌍 Supported Languages

English, Spanish, French, German, Italian, Portuguese, Russian, Mandarin, Japanese, Korean, Arabic, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi

---

## 🔐 Security & Privacy

- End-to-end encryption for sensitive data
- HIPAA-compliant data storage
- User-controlled data sharing
- Secure authentication
- Regular security audits

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the SahAI team

- **Aditya Deshpande** - [GitHub](https://github.com/adityadeshpande41)
- **Esha Pandey** - Product & Design

---

## 🙏 Acknowledgments

- OpenAI for GPT-4, Whisper, and Vision APIs
- ElevenLabs for premium voice synthesis technology
- shadcn/ui for beautiful UI components
- The open-source community for amazing tools and libraries
- VibeFlow for inspiration and support

---

## 📞 Contact & Support

- **Website**: [Coming Soon]
- **Email**: support@sahai.app
- **GitHub Issues**: [Report a bug](https://github.com/adityadeshpande41/SahAI/issues)

---

<div align="center">
  <strong>Made with ❤️ for better health outcomes</strong>
  
  ⭐ Star us on GitHub if you find SahAI helpful!
</div>
