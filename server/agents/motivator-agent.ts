import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MotivationContext {
  userName: string;
  streaks: {
    medication: number;
    meals: number;
    vitals: number;
  };
  twinScore: number;
  recentAchievements?: string[];
  challenges?: string[];
}

export async function generateMotivationalMessage(context: MotivationContext): Promise<string> {
  const { userName, streaks, twinScore, recentAchievements, challenges } = context;

  const prompt = `You are SahAI, a caring and encouraging health companion for ${userName}, an elderly person managing their health.

Current Status:
- Medication streak: ${streaks.medication} days
- Meal logging streak: ${streaks.meals} days  
- Vitals tracking streak: ${streaks.vitals} days
- Routine Twin score: ${twinScore}%
${recentAchievements ? `\nRecent achievements: ${recentAchievements.join(", ")}` : ""}
${challenges ? `\nCurrent challenges: ${challenges.join(", ")}` : ""}

Generate a warm, encouraging message (2-3 sentences max) that:
1. Celebrates their progress and streaks
2. Motivates them to keep going
3. Uses simple, friendly language
4. Feels personal and caring, not robotic
5. If they have a long streak, celebrate it enthusiastically
6. If they're just starting, encourage them warmly

Keep it short, positive, and actionable. Use emojis sparingly (1-2 max).`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are SahAI, a warm and encouraging health companion for elderly users. Keep messages short, simple, and motivating.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content?.trim() || "You're doing great! Keep up the good work with your health routine. 💪";
  } catch (error) {
    console.error("Motivator agent error:", error);
    return "You're doing great! Keep up the good work with your health routine. 💪";
  }
}

export async function generateDailyQuote(): Promise<string> {
  const quotes = [
    "Every small step you take today builds a healthier tomorrow. 🌟",
    "Your health is an investment, not an expense. Keep going! 💪",
    "Consistency is key - you're doing amazing by showing up today! ✨",
    "Small changes lead to big results. You've got this! 🌱",
    "Your body is your home - take good care of it! 🏡",
    "Progress, not perfection. Every day is a fresh start! 🌅",
    "You're stronger than you think. Keep moving forward! 💎",
    "Health is wealth, and you're investing wisely! 🌟",
    "One day at a time, one choice at a time. You're doing great! 🎯",
    "Your future self will thank you for the care you're taking today! 🙏",
  ];
  
  // Return a random quote (or could be date-based for daily rotation)
  const index = new Date().getDate() % quotes.length;
  return quotes[index];
}

export async function generateMealMotivation(foodItems: string, calories: number): Promise<string> {
  const prompt = `You are SahAI, a caring health companion for elderly users.

The user just logged: ${foodItems} (${calories} calories)

Generate a short, encouraging message (1-2 sentences) that:
1. If it's a healthy meal: Celebrate their good choice
2. If it's less healthy (pizza, fried food, sweets): Gently encourage balance without being judgmental
3. Provide a simple, actionable tip for their next meal
4. Keep it warm, supportive, and simple

Be positive and constructive, never critical or preachy.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are SahAI, a supportive health companion. Be encouraging and practical, never judgmental.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || "Great job logging your meal! Remember to balance it with some veggies and water. 🥗";
  } catch (error) {
    console.error("Meal motivation error:", error);
    return "Great job logging your meal! Remember to balance it with some veggies and water. 🥗";
  }
}

export async function generateExerciseMotivation(hasExercisedToday: boolean): Promise<string> {
  if (hasExercisedToday) {
    const messages = [
      "Fantastic! You exercised today. Your body and mind thank you! 💪",
      "Great work staying active! Movement is medicine. Keep it up! 🌟",
      "You're crushing it! Regular movement keeps you strong and healthy. ✨",
      "Amazing! Every bit of movement counts. You're doing wonderful! 🎯",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    const messages = [
      "Even a short walk makes a difference. How about 10 minutes today? 🚶",
      "Your body loves movement! Try some gentle stretches or a short walk. 🌿",
      "Small steps count! A little movement today keeps you feeling great. 💚",
      "Ready to move? Even light activity helps your health and mood! ☀️",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export async function generateActivityMotivation(activityType: string, duration: number): Promise<string> {
  const prompt = `You are SahAI, a caring health companion for elderly users.

The user just logged: ${activityType} for ${duration} minutes

Generate a short, encouraging message (1-2 sentences) that:
1. Celebrates their effort and specific activity
2. Mentions a health benefit of this activity
3. Provides gentle encouragement to keep it up or suggests a next step
4. Keep it warm, supportive, and age-appropriate

Be enthusiastic but not over-the-top. Make it personal and specific to the activity.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are SahAI, a supportive health companion. Be encouraging and specific about exercise benefits.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || `Great job with ${activityType}! ${duration} minutes of movement is excellent for your health. Keep it up! 💪`;
  } catch (error) {
    console.error("Activity motivation error:", error);
    return `Great job with ${activityType}! ${duration} minutes of movement is excellent for your health. Keep it up! 💪`;
  }
}

export async function generateMedicationMotivation(medicationName: string, adherenceRate: number): Promise<string> {
  const prompt = `You are SahAI, a caring health companion for elderly users.

The user just took their medication: ${medicationName}
Their current adherence rate is: ${adherenceRate}%

Generate a short, encouraging message (1-2 sentences) that:
1. Celebrates taking their medication
2. If adherence is high (>80%): Praise their consistency
3. If adherence is moderate (50-80%): Gently encourage improvement
4. If adherence is low (<50%): Provide supportive encouragement without judgment
5. Keep it warm, positive, and supportive

Be caring and understanding, never judgmental.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are SahAI, a supportive health companion. Be encouraging about medication adherence.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || `Great job taking your ${medicationName}! Staying consistent with medications is so important for your health. 💊`;
  } catch (error) {
    console.error("Medication motivation error:", error);
    return `Great job taking your ${medicationName}! Staying consistent with medications is so important for your health. 💊`;
  }
}

export function getVitalsMotivation(): string {
  const messages = [
    "Tracking your vitals helps you stay on top of your health. Great job being proactive! 📊",
    "Regular monitoring is key to managing your health. You're doing wonderful! ❤️",
    "Every reading you log helps you and your doctor make better decisions. Keep it up! 💪",
    "Staying aware of your numbers is a sign of taking charge of your health. Excellent! 🌟",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getSymptomsMotivation(): string {
  const messages = [
    "Tracking symptoms helps identify patterns. You're being smart about your health! 📝",
    "Logging how you feel is important for understanding your health. Great work! 💚",
    "Your symptom tracking helps catch issues early. You're taking great care of yourself! 🌟",
    "Being aware of changes in your body is wise. Keep noting what you notice! 👍",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getMedicationsMotivation(): string {
  const messages = [
    "Taking your medications on time is one of the best things you can do for your health! 💊",
    "Consistency with medications makes a real difference. You're doing great! 🌟",
    "Every dose you take is a step toward better health. Keep up the excellent work! 💪",
    "Managing your medications shows you care about your wellbeing. Wonderful job! ❤️",
    "Staying on track with your meds helps you feel your best. You've got this! ✨",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getStreakEmoji(days: number): string {
  if (days === 0) return "🌱";
  if (days < 3) return "🔥";
  if (days < 7) return "⭐";
  if (days < 14) return "🏆";
  if (days < 30) return "💎";
  return "👑";
}

export function getStreakMessage(days: number, type: string): string {
  if (days === 0) return `Start your ${type} streak today!`;
  if (days === 1) return `Great start! Keep it going.`;
  if (days < 7) return `${days} days strong!`;
  if (days < 14) return `Amazing! ${days} day streak!`;
  if (days < 30) return `Incredible! ${days} days in a row!`;
  return `Legendary! ${days} day streak! 🎉`;
}
