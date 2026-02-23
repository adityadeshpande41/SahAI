import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mic,
  Send,
  RefreshCw,
  Languages,
  MessageSquare,
  Heart,
  Sparkles,
  AlertCircle,
  Loader2,
  Square,
  Volume2,
  VolumeX,
  Trash2,
} from "lucide-react";
import { useConversationHistory, useSendMessage, useCurrentUser, useClearConversationHistory } from "@/hooks/use-api";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { speechToText, textToSpeech } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@/lib/mock-data";

const quickPrompts = [
  "I took my meds",
  "I ate",
  "I feel weird",
  "What's unusual today?",
  "I took it",
  "I'm out",
];

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
];

const eventParsing: Record<string, { type: string; confidence: number; parsed: string }> = {
  "I took my meds": { type: "med_taken", confidence: 0.85, parsed: "Medication taken (which one?)" },
  "I ate": { type: "meal_logged", confidence: 0.70, parsed: "Meal logged (meal or snack?)" },
  "I feel weird": { type: "symptom_reported", confidence: 0.60, parsed: "Symptom reported (needs clarification)" },
  "What's unusual today?": { type: "user_question", confidence: 0.95, parsed: "Routine summary request" },
  "I took it": { type: "med_taken", confidence: 0.50, parsed: "Ambiguous — which medicine?" },
  "I'm out": { type: "activity_started", confidence: 0.55, parsed: "Ambiguous — walking or traveling?" },
};

const ambiguityResponses: Record<string, ChatMessage[]> = {
  "I took it": [
    { id: 1, sender: "sahai", text: "Which medicine did you take? Pick one:\n\n1. Metformin 500mg (morning)\n2. Amlodipine 5mg\n3. Something else\n\nOr just say the name and I'll log it.", time: "" },
  ],
  "I'm out": [
    { id: 1, sender: "sahai", text: "Are you:\n\n1. Going for a walk\n2. Heading somewhere (travel)\n3. Just stepping out briefly\n\nThis helps me watch your routine better.", time: "" },
  ],
};

export default function Voice() {
  const [inputText, setInputText] = useState("");
  const [simpleMode, setSimpleMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Fetch conversation history and user data
  const { data: historyData, isLoading } = useConversationHistory(50);
  const { data: userData } = useCurrentUser();
  const sendMessageMutation = useSendMessage();
  const clearChatMutation = useClearConversationHistory();
  
  // Get user's preferred language
  const user = userData?.user || userData;
  const userLanguage = user?.language || "English";
  
  // Voice recording
  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording } = useVoiceRecording();

  // Convert API history to chat messages
  const messages: ChatMessage[] = historyData?.history?.map((msg: any, idx: number) => ({
    id: idx,
    sender: msg.sender,
    text: msg.message,
    time: new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  })) || [];

  // Add welcome message if no history
  if (messages.length === 0 && !isLoading) {
    messages.push({
      id: 0,
      sender: "sahai",
      text: "Hi! I'm SahAI, your health copilot. How can I help you today? You can tell me about your meals, medications, or how you're feeling.",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    });
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending]);

  // Auto-greeting when page loads
  useEffect(() => {
    if (!hasGreeted && !isLoading && user && autoSpeak) {
      setHasGreeted(true);
      
      // Wait a moment for the page to settle
      const timer = setTimeout(() => {
        const greetings: Record<string, string> = {
          "English": "Hello! I'm SahAI, your health companion. How can I help you today?",
          "Hindi": "नमस्ते! मैं सहाई हूं, आपका स्वास्थ्य साथी। आज मैं आपकी कैसे मदद कर सकता हूं?",
          "Marathi": "नमस्कार! मी सहाई आहे, तुमचा आरोग्य साथी। आज मी तुम्हाला कशी मदत करू शकतो?",
          "Tamil": "வணக்கம்! நான் சஹாஐ, உங்கள் ஆரோக்கிய துணை. இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
          "Telugu": "నమస్కారం! నేను సహాఐ, మీ ఆరోగ్య సహచరుడు. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
          "Bengali": "নমস্কার! আমি সহাঐ, আপনার স্বাস্থ্য সঙ্গী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
          "Gujarati": "નમસ્તે! હું સહાઐ છું, તમારો આરોગ્ય સાથી. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
          "Kannada": "ನಮಸ್ಕಾರ! ನಾನು ಸಹಾಐ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಚರ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
          "Spanish": "¡Hola! Soy SahAI, tu compañero de salud. ¿Cómo puedo ayudarte hoy?",
          "French": "Bonjour! Je suis SahAI, votre compagnon de santé. Comment puis-je vous aider aujourd'hui?",
          "German": "Hallo! Ich bin SahAI, Ihr Gesundheitsbegleiter. Wie kann ich Ihnen heute helfen?",
          "Chinese": "你好！我是SahAI，您的健康伙伴。今天我能为您做些什么？",
          "Japanese": "こんにちは！私はSahAI、あなたの健康パートナーです。今日はどのようにお手伝いできますか？",
          "Arabic": "مرحبا! أنا SahAI، رفيقك الصحي. كيف يمكنني مساعدتك اليوم؟",
        };
        
        const greeting = greetings[userLanguage] || greetings["English"];
        speakText(greeting);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasGreeted, isLoading, user, autoSpeak, userLanguage]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setInputText("");
    
    // Optimistic update - add user message immediately
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: userMessage,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
    
    try {
      const response = await sendMessageMutation.mutateAsync(userMessage);
      
      // Auto-speak the response in parallel (don't wait)
      if (autoSpeak && response?.reply) {
        speakText(response.reply).catch(err => {
          console.error("TTS error:", err);
          // Silently fail - don't block the UI
        });
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Pass user's language preference to TTS
      const audioBlob = await textToSpeech(text, undefined, { language: userLanguage });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      
      await audio.play();
    } catch (error: any) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      // Don't show error toast for TTS failures - it's not critical
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
        toast({
          title: "Recording started",
          description: "Speak now. Click again to stop.",
        });
      } catch (error: any) {
        toast({
          title: "Microphone access denied",
          description: error.message || "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
    }
  };

  // Process audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
      const processAudio = async () => {
        try {
          // Show processing state immediately
          const processingToast = toast({
            title: "Processing...",
            description: "Converting speech to text",
            duration: 30000, // Long duration
          });
          
          const result = await speechToText(audioBlob);
          
          // Dismiss processing toast
          processingToast.dismiss?.();
          
          if (result.transcript) {
            // Auto-send if transcript is clear
            if (result.transcript.length > 5) {
              sendMessage(result.transcript);
              toast({
                title: "Message sent",
                description: `"${result.transcript.substring(0, 50)}${result.transcript.length > 50 ? '...' : ''}"`,
                duration: 2000,
              });
            } else {
              // Put in input for editing if too short
              setInputText(result.transcript);
            }
          }
          
          clearRecording();
        } catch (error: any) {
          toast({
            title: "Speech recognition failed",
            description: error.message || "Please try speaking more clearly.",
            variant: "destructive",
          });
          clearRecording();
        }
      };
      
      processAudio();
    }
  }, [audioBlob, isRecording]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] animate-fade-in">
      <div className="flex items-center justify-between gap-1 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient" data-testid="text-voice-title">Talk to SahAI</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your health conversation assistant</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} data-testid="switch-auto-speak" />
          </div>
          <div className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            <Switch checked={pushToTalk} onCheckedChange={setPushToTalk} data-testid="switch-push-to-talk" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1" data-testid="quick-prompts">
        {quickPrompts.map(prompt => (
          <Button
            key={prompt}
            variant="secondary"
            size="sm"
            className="whitespace-nowrap flex-shrink-0"
            onClick={() => sendMessage(prompt)}
            data-testid={`button-prompt-${prompt.toLowerCase().replace(/[\s?']/g, "-")}`}
          >
            {prompt}
          </Button>
        ))}
      </div>

      <Card className="glass flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.sender}-${msg.id}`}
              >
                <div className={`max-w-[85%] ${msg.sender === "user" ? "order-1" : "order-1"}`}>
                  {msg.sender === "sahai" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center">
                        <Heart className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">SahAI</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}>
                    {msg.text.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
                    ))}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${msg.sender === "user" ? "text-right" : ""}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-primary/15 dark:bg-primary/25 flex items-center justify-center">
                      <Heart className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">SahAI</span>
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border glass-subtle">
          {isSpeaking && (
            <div className="mb-2 flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Playing audio...</span>
              </div>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={stopSpeaking} 
                aria-label="Stop audio"
                className="h-8"
              >
                <Square className="w-3.5 h-3.5 mr-1.5" />
                Stop
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant={isRecording ? "destructive" : "secondary"}
              aria-label="Voice input" 
              data-testid="button-mic"
              onClick={handleMicClick}
              className={isRecording ? "animate-pulse" : ""}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm"
              data-testid="input-chat"
            />
            <Button size="icon" onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || sendMessageMutation.isPending} aria-label="Send message" className="active:scale-[0.97]" data-testid="button-send">
              {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground"
              data-testid="button-repeat"
              onClick={() => {
                const lastSahai = [...messages].reverse().find(m => m.sender === "sahai");
                if (lastSahai) {
                  sendMessage(`Repeat: ${lastSahai.text}`);
                }
              }}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Repeat
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground"
              data-testid="button-language"
              onClick={() => setShowLanguageDialog(true)}
            >
              <Languages className="w-3 h-3 mr-1" /> Say in my language
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-destructive"
              data-testid="button-clear-chat"
              onClick={() => {
                if (confirm("Are you sure you want to clear all chat history?")) {
                  clearChatMutation.mutate();
                }
              }}
              disabled={clearChatMutation.isPending}
            >
              {clearChatMutation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 mr-1" />
              )}
              Clear chat
            </Button>
          </div>
        </div>
      </Card>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent aria-describedby="language-dialog-description">
          <DialogHeader>
            <DialogTitle>Choose Language</DialogTitle>
            <DialogDescription id="language-dialog-description">
              Select a language to translate the last message
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="secondary"
                className="justify-start h-auto py-3"
                onClick={() => {
                  const lastSahai = [...messages].reverse().find(m => m.sender === "sahai");
                  if (lastSahai) {
                    sendMessage(`Translate the last message to ${lang.name}`);
                  } else {
                    sendMessage(`Please respond in ${lang.name}`);
                  }
                  setShowLanguageDialog(false);
                }}
              >
                <span className="text-2xl mr-2">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </Button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              Your preferred language: <span className="font-medium text-foreground">{userLanguage}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can change this in Settings
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
