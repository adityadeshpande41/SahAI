import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  Send,
  RefreshCw,
  Languages,
  MessageSquare,
  Heart,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { demoConversations, type ChatMessage } from "@/lib/mock-data";

const quickPrompts = [
  "I took my meds",
  "I ate",
  "I feel weird",
  "What's unusual today?",
  "I took it",
  "I'm out",
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, sender: "sahai", text: "Hi! I'm SahAI, your health copilot. How can I help you today? You can tell me about your meals, medications, or how you're feeling.", time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) },
  ]);
  const [inputText, setInputText] = useState("");
  const [simpleMode, setSimpleMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastParsedEvent, setLastParsedEvent] = useState<{ type: string; confidence: number; parsed: string } | null>(null);
  const [lastUserText, setLastUserText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const now = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: text.trim(),
      time: now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    setLastUserText(text.trim());

    const parsedEvent = Object.entries(eventParsing).find(
      ([k]) => text.trim().toLowerCase() === k.toLowerCase()
    );
    if (parsedEvent) setLastParsedEvent(parsedEvent[1]);
    else setLastParsedEvent(null);

    const ambiguityKey = Object.keys(ambiguityResponses).find(
      k => text.trim().toLowerCase() === k.toLowerCase()
    );

    const demoKey = Object.keys(demoConversations).find(
      k => text.trim().toLowerCase().includes(k.toLowerCase())
    );

    setTimeout(() => {
      setIsTyping(false);
      if (ambiguityKey) {
        const resp = ambiguityResponses[ambiguityKey][0];
        setMessages(prev => [...prev, { ...resp, id: Date.now() + 1, time: now() }]);
      } else if (demoKey) {
        const convo = demoConversations[demoKey];
        const responses = convo.filter(m => m.sender === "sahai");
        if (responses.length > 0) {
          setMessages(prev => [...prev, { ...responses[0], id: Date.now() + 1, time: now() }]);
          if (responses.length > 1) {
            setTimeout(() => {
              setMessages(prev => [...prev, { ...responses[responses.length - 1], id: Date.now() + 2, time: now() }]);
            }, 2000);
          }
        }
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: "sahai",
          text: simpleMode
            ? "I heard you. Let me help. Can you tell me more about what you need?"
            : "I understand. Could you tell me a bit more so I can help you better? For example, you can say 'I took my meds', 'I ate', or 'I feel unwell'.",
          time: now(),
        }]);
      }
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] animate-fade-in">
      <div className="flex items-center justify-between gap-1 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-voice-title">Talk to SahAI</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your health conversation assistant</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Simple</span>
          <Switch checked={simpleMode} onCheckedChange={setSimpleMode} data-testid="switch-simple-mode" />
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

      <Card className="flex-1 flex flex-col min-h-0">
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
            {isTyping && (
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
        {lastParsedEvent && (
          <div className="px-4 py-2 border-t border-border bg-muted/50" data-testid="card-parsed-event">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">Parsed:</span>
              <Badge variant="secondary" className="text-xs no-default-active-elevate">{lastParsedEvent.type}</Badge>
              <span className="text-muted-foreground">—</span>
              <span className={lastParsedEvent.confidence < 0.7 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                {Math.round(lastParsedEvent.confidence * 100)}% conf
              </span>
              {lastParsedEvent.confidence < 0.7 && (
                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3" /> Ambiguous
                </span>
              )}
            </div>
          </div>
        )}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" aria-label="Voice input" data-testid="button-mic">
              <Mic className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm"
              data-testid="input-chat"
            />
            <Button size="icon" onClick={() => sendMessage(inputText)} disabled={!inputText.trim()} aria-label="Send message" data-testid="button-send">
              <Send className="w-4 h-4" />
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
                  setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: "sahai",
                    text: `(Repeating) ${lastSahai.text}`,
                    time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
                  }]);
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
              onClick={() => {
                setMessages(prev => [...prev, {
                  id: Date.now(),
                  sender: "sahai",
                  text: "मैंने आपकी बात समझ ली। क्या आप मुझे और बता सकते हैं? आप कह सकते हैं 'मैंने दवाई ली', 'मैंने खाना खाया', या 'मुझे अच्छा नहीं लग रहा'।",
                  time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
                }]);
              }}
            >
              <Languages className="w-3 h-3 mr-1" /> Say in my language
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
