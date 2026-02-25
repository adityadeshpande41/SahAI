import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // If no Resend API key, log and return success (for development)
  if (!resend) {
    console.log('📧 Email would be sent (no RESEND_API_KEY configured):');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.html.substring(0, 200)}...`);
    return { 
      success: true, 
      messageId: 'dev-mode-' + Date.now(),
      error: 'Development mode - email not actually sent'
    };
  }

  try {
    const result = await resend.emails.send({
      from: options.from || 'SahAI <noreply@sahai.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('❌ Email send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('✅ Email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id || 'unknown' };
  } catch (error: any) {
    console.error('❌ Email send failed:', error);
    return { success: false, error: error.message };
  }
}

export function generateProgressUpdateEmail(data: {
  userName: string;
  caregiverName: string;
  update: any;
  todayStats: {
    medications: { taken: number; total: number; adherence: number };
    meals: number;
    activities: number;
    symptoms: number;
  };
}): string {
  const { userName, caregiverName, update, todayStats } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Update from ${userName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #10b981;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .main-message {
      font-size: 16px;
      color: #374151;
      margin-bottom: 24px;
      line-height: 1.8;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 24px 0;
    }
    .stat-card {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #10b981;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .stat-detail {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }
    .details-section {
      background-color: #f0fdf4;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .detail-item {
      margin-bottom: 12px;
      padding-left: 20px;
      position: relative;
    }
    .detail-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .detail-label {
      font-weight: 600;
      color: #065f46;
      margin-bottom: 4px;
    }
    .detail-text {
      color: #047857;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    .button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .alert-badge {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💚 SahAI</div>
      <div class="subtitle">Health Progress Update</div>
    </div>

    <div class="alert-badge">📊 Daily Update</div>
    
    <div class="greeting">
      ${update.greeting || `Hi ${caregiverName},`}
    </div>

    <div class="main-message">
      ${update.mainMessage}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Medications</div>
        <div class="stat-value">${todayStats.medications.adherence}%</div>
        <div class="stat-detail">${todayStats.medications.taken}/${todayStats.medications.total} taken</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Meals Logged</div>
        <div class="stat-value">${todayStats.meals}</div>
        <div class="stat-detail">Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Activities</div>
        <div class="stat-value">${todayStats.activities}</div>
        <div class="stat-detail">Logged</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Symptoms</div>
        <div class="stat-value">${todayStats.symptoms}</div>
        <div class="stat-detail">Reported</div>
      </div>
    </div>

    ${update.details ? `
    <div class="details-section">
      <div class="detail-item">
        <div class="detail-label">💊 Medications</div>
        <div class="detail-text">${update.details.medications}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">🍽️ Meals</div>
        <div class="detail-text">${update.details.meals}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">🏃 Activities</div>
        <div class="detail-text">${update.details.activities}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">😊 Mood & Wellbeing</div>
        <div class="detail-text">${update.details.mood}</div>
      </div>
    </div>
    ` : ''}

    ${update.customNote && update.customNote !== 'No custom message' ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">Personal Note:</div>
      <div style="color: #78350f;">${update.customNote}</div>
    </div>
    ` : ''}

    <div style="margin-top: 24px; color: #374151;">
      ${update.closing || 'Stay healthy and take care!'}
    </div>

    <div class="footer">
      <p>This update was sent from <strong>${userName}</strong> via SahAI Health Companion</p>
      <p style="margin-top: 8px; font-size: 12px;">
        Sent on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
        at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateAlertEmail(data: {
  userName: string;
  caregiverName: string;
  alert: any;
  urgency: 'low' | 'medium' | 'high';
}): string {
  const { userName, caregiverName, alert, urgency } = data;
  
  const urgencyColors = {
    low: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    high: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  };
  
  const colors = urgencyColors[urgency];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Alert - ${userName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .alert-header {
      background-color: ${colors.bg};
      border-left: 6px solid ${colors.border};
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .alert-title {
      font-size: 24px;
      font-weight: bold;
      color: ${colors.text};
      margin-bottom: 8px;
    }
    .alert-subtitle {
      color: ${colors.text};
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-header">
      <div class="alert-title">⚠️ ${alert.subject}</div>
      <div class="alert-subtitle">Urgency: ${urgency.toUpperCase()}</div>
    </div>
    <p><strong>Hi ${caregiverName},</strong></p>
    <p>${alert.message}</p>
    ${alert.actionRequired ? `<p><strong>Action Required:</strong> ${alert.actionRequired}</p>` : ''}
    ${alert.context ? `<p><strong>Context:</strong> ${alert.context}</p>` : ''}
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px;">
      <p>Alert from <strong>${userName}</strong> via SahAI Health Companion</p>
      <p style="margin-top: 8px; font-size: 12px;">
        ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
