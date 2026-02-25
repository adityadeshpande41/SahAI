import { BaseAgent, type AgentContext, type AgentResponse } from "./base-agent";
import { storage } from "../storage";
import { sendEmail, generateProgressUpdateEmail, generateAlertEmail } from "../lib/email-service";

export class CaregiverAgent extends BaseAgent {
  constructor() {
    super("CaregiverAgent");
  }

  async execute(
    input: {
      action: "generate_alert" | "generate_summary" | "check_sharing_permissions" | "send_notification" | "send_progress_update";
      data?: any;
    },
    context: AgentContext
  ): Promise<AgentResponse> {
    this.log(`Caregiver action: ${input.action}`);

    try {
      switch (input.action) {
        case "generate_alert":
          return await this.generateAlert(input.data, context);
        case "generate_summary":
          return await this.generateSummary(input.data, context);
        case "check_sharing_permissions":
          return await this.checkSharingPermissions(input.data, context);
        case "send_notification":
          return await this.sendNotification(input.data, context);
        case "send_progress_update":
          return await this.sendProgressUpdate(input.data, context);
        default:
          return { success: false, message: "Unknown action" };
      }
    } catch (error: any) {
      this.log(`Error in caregiver agent: ${error.message}`, "error");
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async generateAlert(
    data: { riskAlert: any; urgency: "low" | "medium" | "high" },
    context: AgentContext
  ): Promise<AgentResponse> {
    const caregivers = await storage.getCaregiverContacts(context.user.id);
    const activeCaregivers = caregivers.filter(c => c.active);

    if (activeCaregivers.length === 0) {
      return {
        success: true,
        data: { sent: false, reason: "No active caregivers" },
      };
    }

    // Determine which caregivers should be notified based on sharing level
    const toNotify = activeCaregivers.filter(c => {
      if (data.urgency === "high") return true; // Always notify on high urgency
      if (data.urgency === "medium" && c.sharingLevel !== "emergency_only") return true;
      if (c.sharingLevel === "daily_summary") return true;
      return false;
    });

    if (toNotify.length === 0) {
      return {
        success: true,
        data: { sent: false, reason: "No caregivers match sharing preferences" },
      };
    }

    // Generate alert message
    const systemPrompt = `Generate a caregiver alert message. Return JSON:
{
  "subject": "Brief subject line",
  "message": "Clear, actionable message for caregiver",
  "urgency": "${data.urgency}",
  "actionRequired": "What caregiver should do",
  "context": "Relevant background information"
}

Risk alert: ${JSON.stringify(data.riskAlert)}
User: ${context.user.name}

Tone: Clear, factual, actionable. Don't alarm unnecessarily but convey importance.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate alert" },
    ], {
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const alert = JSON.parse(response.choices[0].message.content);

    // Store notifications
    for (const caregiver of toNotify) {
      await storage.createCaregiverNotification(caregiver.id, context.user.id, {
        notificationType: "alert",
        content: JSON.stringify(alert),
        sent: false, // Will be sent by notification service
      });
    }

    return {
      success: true,
      data: {
        sent: true,
        recipientCount: toNotify.length,
        alert,
      },
    };
  }

  private async generateSummary(
    data: { summaryType: "daily" | "weekly"; period?: string },
    context: AgentContext
  ): Promise<AgentResponse> {
    const caregivers = await storage.getCaregiverContacts(context.user.id);
    const summaryRecipients = caregivers.filter(
      c => c.active && (c.sharingLevel === "daily_summary" || c.sharingLevel === "meds_only")
    );

    if (summaryRecipients.length === 0) {
      return {
        success: true,
        data: { sent: false, reason: "No caregivers subscribed to summaries" },
      };
    }

    // Get data based on summary type
    const days = data.summaryType === "daily" ? 1 : 7;
    const meds = await storage.getHistoricalMedications(context.user.id, days);
    const meals = await storage.getHistoricalMeals(context.user.id, days);
    const symptoms = await storage.getRecentSymptoms(context.user.id, days);
    const alerts = await storage.getActiveRiskAlerts(context.user.id);

    const medsTaken = meds.filter(m => m.taken).length;
    const adherenceRate = meds.length > 0 ? (medsTaken / meds.length) * 100 : 100;

    const systemPrompt = `Generate a caregiver summary. Return JSON:
{
  "subject": "Summary subject line",
  "overview": "High-level status",
  "medicationStatus": {
    "adherence": "${Math.round(adherenceRate)}%",
    "taken": ${medsTaken},
    "total": ${meds.length},
    "concerns": ["concern 1"] or []
  },
  "healthStatus": {
    "meals": "${meals.length} logged",
    "symptoms": "${symptoms.length} reported",
    "overallStatus": "good" | "fair" | "needs attention"
  },
  "alerts": {
    "active": ${alerts.length},
    "summary": "Brief summary of any alerts"
  },
  "recommendations": ["recommendation 1", "recommendation 2"],
  "positiveHighlights": ["positive 1", "positive 2"]
}

Period: ${data.summaryType} (last ${days} days)
User: ${context.user.name}

Tone: Informative, balanced. Highlight both concerns and positives.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate summary" },
    ], {
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(response.choices[0].message.content);

    // Store notifications
    for (const caregiver of summaryRecipients) {
      await storage.createCaregiverNotification(caregiver.id, context.user.id, {
        notificationType: "summary",
        content: JSON.stringify(summary),
        sent: false,
      });
    }

    return {
      success: true,
      data: {
        sent: true,
        recipientCount: summaryRecipients.length,
        summary,
      },
    };
  }

  private async checkSharingPermissions(
    data: { dataType: "medication" | "meal" | "symptom" | "all" },
    context: AgentContext
  ): Promise<AgentResponse> {
    const caregivers = await storage.getCaregiverContacts(context.user.id);
    const activeCaregivers = caregivers.filter(c => c.active);

    const permissions = activeCaregivers.map(c => ({
      caregiverId: c.id,
      name: c.name,
      relationship: c.relationship,
      sharingLevel: c.sharingLevel || "emergency_only",
      canAccess: this.canAccessDataType(c.sharingLevel || "emergency_only", data.dataType),
    }));

    return {
      success: true,
      data: { permissions },
    };
  }

  private canAccessDataType(sharingLevel: string, dataType: string): boolean {
    if (sharingLevel === "daily_summary") return true;
    if (sharingLevel === "meds_only" && dataType === "medication") return true;
    if (sharingLevel === "emergency_only" && dataType === "all") return false;
    return false;
  }

  private async sendNotification(
    data: { caregiverId: string; message: string; urgent: boolean },
    context: AgentContext
  ): Promise<AgentResponse> {
    // Create notification record
    await storage.createCaregiverNotification(data.caregiverId, context.user.id, {
      notificationType: data.urgent ? "alert" : "summary",
      content: data.message,
      sent: false,
    });

    // In production, this would trigger actual notification service (SMS, email, push)
    this.log(`Notification queued for caregiver ${data.caregiverId}`);

    return {
      success: true,
      data: { queued: true },
    };
  }

  private async sendProgressUpdate(
    data: { customMessage?: string; includeData?: string[] },
    context: AgentContext
  ): Promise<AgentResponse> {
    const caregivers = await storage.getCaregiverContacts(context.user.id);
    const activeCaregivers = caregivers.filter(c => c.active);

    if (activeCaregivers.length === 0) {
      return {
        success: false,
        message: "No active caregivers found. Please add a caregiver first.",
      };
    }

    // Get today's data for progress update
    const todayMeds = await storage.getTodayMedications(context.user.id);
    const todayMeals = await storage.getTodayMeals(context.user.id);
    const recentSymptoms = await storage.getRecentSymptoms(context.user.id, 1);
    const recentActivities = await storage.getRecentActivities(context.user.id, 5);

    const medsTaken = todayMeds.filter((m: any) => m.taken).length;
    const adherence = todayMeds.length > 0 ? Math.round((medsTaken / todayMeds.length) * 100) : 100;

    // Generate progress update message
    const systemPrompt = `Generate a warm, positive progress update message for a caregiver. Return JSON:
{
  "subject": "Progress Update from ${context.user.name}",
  "greeting": "Warm greeting",
  "mainMessage": "Main update message (2-3 sentences)",
  "smsMessage": "Short SMS-friendly version (160 chars max)",
  "details": {
    "medications": "Medication status",
    "meals": "Meal status",
    "activities": "Activity status",
    "mood": "Overall mood/wellbeing"
  },
  "customNote": "${data.customMessage || 'No custom message'}",
  "closing": "Warm closing"
}

Today's Data:
- Medications: ${medsTaken}/${todayMeds.length} taken (${adherence}% adherence)
- Meals: ${todayMeals.length} logged
- Symptoms: ${recentSymptoms.length} reported
- Activities: ${recentActivities.length} logged

${data.customMessage ? `User's custom message: "${data.customMessage}"` : ''}

Tone: Warm, positive, reassuring. Focus on progress and positives. Keep it conversational and personal.`;

    const response = await this.callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate progress update" },
    ], {
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const update = JSON.parse(response.choices[0].message.content);

    // Send emails to all active caregivers
    const sentTo = [];
    const emailResults = [];
    
    for (const caregiver of activeCaregivers) {
      // Skip caregivers without email
      if (!caregiver.email) {
        this.log(`Skipping caregiver ${caregiver.name} - no email address`);
        sentTo.push({
          name: caregiver.name,
          relationship: caregiver.relationship,
          email: null,
          sent: false,
          error: 'No email address',
        });
        continue;
      }

      // Generate HTML email
      const emailHtml = generateProgressUpdateEmail({
        userName: context.user.name || 'Your loved one',
        caregiverName: caregiver.name,
        update,
        todayStats: {
          medications: { taken: medsTaken, total: todayMeds.length, adherence },
          meals: todayMeals.length,
          activities: recentActivities.length,
          symptoms: recentSymptoms.length,
        },
      });

      // Send email
      const emailResult = await sendEmail({
        to: caregiver.email || '',
        subject: update.subject || `Health Update from ${context.user.name}`,
        html: emailHtml,
        from: 'SahAI <onboarding@resend.dev>', // Use Resend's test domain
      });

      emailResults.push(emailResult);

      // Store notification
      await storage.createCaregiverNotification(caregiver.id, context.user.id, {
        notificationType: "summary",
        content: JSON.stringify(update),
        sent: emailResult.success,
      });
      
      sentTo.push({
        name: caregiver.name,
        relationship: caregiver.relationship,
        email: caregiver.email,
        sent: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
      });

      // Add delay to avoid rate limits (500ms between emails)
      if (activeCaregivers.indexOf(caregiver) < activeCaregivers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successCount = emailResults.filter(r => r.success).length;

    return {
      success: true,
      data: {
        sent: true,
        recipientCount: activeCaregivers.length,
        successCount,
        recipients: sentTo,
        update,
        message: `Progress update sent to ${successCount}/${activeCaregivers.length} caregiver(s)`,
      },
    };
  }
}
