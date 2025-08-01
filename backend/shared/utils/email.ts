import sgMail from "@sendgrid/mail";
import { ParameterStoreService } from "./parameters";

// Initialize SendGrid
let isInitialized = false;

async function initializeSendGrid() {
  if (!isInitialized) {
    try {
      const apiKey = await ParameterStoreService.getSendGridApiKey();
      sgMail.setApiKey(apiKey);
      isInitialized = true;
      console.log("SendGrid initialized successfully");
    } catch (error) {
      console.error("Failed to initialize SendGrid:", error);
      throw error;
    }
  }
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface EmailSendOptions {
  to: string;
  template: EmailTemplate;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static readonly DEFAULT_FROM_EMAIL =
    process.env["FROM_EMAIL"] || "noreply@pornspot.ai";
  private static readonly DEFAULT_FROM_NAME =
    process.env["FROM_NAME"] || "PornSpot.ai";

  /**
   * Send an email using SendGrid
   */
  static async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    try {
      // Initialize SendGrid if not already done
      await initializeSendGrid();

      const fromEmail = options.fromEmail || this.DEFAULT_FROM_EMAIL;
      const fromName = options.fromName || this.DEFAULT_FROM_NAME;

      const msg = {
        to: options.to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.template.subject,
        text: options.template.textBody,
        html: options.template.htmlBody,
      };

      const response = await sgMail.send(msg);

      console.log("Email sent successfully:", {
        messageId: response[0].headers["x-message-id"],
        to: options.to,
        subject: options.template.subject,
      });

      return {
        success: true,
        messageId: response[0].headers["x-message-id"] as string,
      };
    } catch (error: any) {
      console.error("Failed to send email:", {
        error: error.message,
        response: error.response?.body,
        to: options.to,
        subject: options.template.subject,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail(
    email: string,
    verificationToken: string,
    firstName?: string
  ): Promise<EmailSendResult> {
    const frontendUrl = await ParameterStoreService.getFrontendUrl();
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
    const displayName = firstName ? firstName : email;

    const template = this.getVerificationEmailTemplate(
      displayName,
      verificationUrl,
      verificationToken
    );

    return this.sendEmail({
      to: email,
      template,
    });
  }

  /**
   * Send welcome email after successful verification
   */
  static async sendWelcomeEmail(
    email: string,
    firstName?: string
  ): Promise<EmailSendResult> {
    const displayName = firstName ? firstName : email;
    const frontendUrl = await ParameterStoreService.getFrontendUrl();
    const loginUrl = `${frontendUrl}/auth/login`;

    const template = this.getWelcomeEmailTemplate(displayName, loginUrl);

    return this.sendEmail({
      to: email,
      template,
    });
  }

  /**
   * Get email verification template
   */
  private static getVerificationEmailTemplate(
    displayName: string,
    verificationUrl: string,
    verificationToken: string
  ): EmailTemplate {
    const subject = "Please verify your email address";

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #f8fafc;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #020817;
    }
    .container {
      background-color: #0f172a;
      border-radius: 12px;
      padding: 40px;
      border: 1px solid #1e293b;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #8b5cf6;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    }
    .title {
      font-size: 24px;
      color: #f8fafc;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .content {
      font-size: 16px;
      margin-bottom: 30px;
      color: #cbd5e1;
    }
    .verify-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.25);
    }
    .verify-button:hover {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.4);
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #334155;
      font-size: 14px;
      color: #64748b;
      text-align: center;
    }
    .token-info {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      font-size: 14px;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PornSpot.ai</div>
      <h1 class="title">Verify Your Email Address</h1>
    </div>
    
    <div class="content">
      <p>Hello ${displayName},</p>
      
      <p>Thank you for signing up for PornSpot.ai! To complete your registration and start exploring our premium adult content, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
      </div>
      
      <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background-color: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155; color: #94a3b8; font-family: 'Courier New', monospace; font-size: 14px;">${verificationUrl}</p>
      
      <div class="token-info">
        <strong style="color: #f8fafc;">Alternative:</strong> You can also verify your email by copying this verification code:
        <div style="background-color: #0f172a; border: 2px solid #8b5cf6; border-radius: 8px; padding: 16px; margin: 12px 0; text-align: center; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #8b5cf6; letter-spacing: 3px; box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.1);">
          ${verificationToken}
        </div>
        <small style="color: #94a3b8;">Enter this code on the verification page if the link doesn't work.</small>
      </div>
      
      <div class="token-info">
        <strong style="color: #f8fafc;">Important:</strong> This verification link will expire in 24 hours for security reasons. If you don't verify your email within this time, you'll need to request a new verification email.
      </div>
      
      <p>If you didn't create an account with PornSpot.ai, please ignore this email.</p>
    </div>
    
    <div class="footer">
      <p>© 2024 PornSpot.ai. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
Hello ${displayName},

Thank you for signing up for PornSpot.ai! To complete your registration, please verify your email address.

Verification Link: ${verificationUrl}

Alternative - Verification Code: ${verificationToken}
(Enter this code on the verification page if the link doesn't work)

This verification link will expire in 24 hours for security reasons. If you don't verify your email within this time, you'll need to request a new verification email.

If you didn't create an account with PornSpot.ai, please ignore this email.

© 2024 PornSpot.ai. All rights reserved.
This is an automated email. Please do not reply to this message.
    `;

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Get welcome email template
   */
  private static getWelcomeEmailTemplate(
    displayName: string,
    loginUrl: string
  ): EmailTemplate {
    const subject = "Welcome to PornSpot.ai!";

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #f8fafc;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #020817;
    }
    .container {
      background-color: #0f172a;
      border-radius: 12px;
      padding: 40px;
      border: 1px solid #1e293b;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #8b5cf6;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
    }
    .title {
      font-size: 24px;
      color: #f8fafc;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .content {
      font-size: 16px;
      margin-bottom: 30px;
      color: #cbd5e1;
    }
    .login-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.25);
    }
    .login-button:hover {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.4);
    }
    .features {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .features h3 {
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
      color: #cbd5e1;
    }
    .features li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #334155;
      font-size: 14px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PornSpot.ai</div>
      <h1 class="title">Welcome to PornSpot.ai!</h1>
    </div>
    
    <div class="content">
      <p>Hello ${displayName},</p>
      
      <p>🎉 Congratulations! Your email has been successfully verified and your PornSpot.ai account is now active.</p>
      
      <p>You now have access to our premium adult content platform with cutting-edge AI-powered features.</p>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="login-button">Start Exploring</a>
      </div>
      
      <div class="features">
        <h3>What you can do now:</h3>
        <ul>
          <li>Browse our extensive collection of premium adult content</li>
          <li>Create and organize your personal albums</li>
          <li>Use AI-powered search and discovery features</li>
          <li>Access exclusive content and features</li>
          <li>Enjoy a personalized experience</li>
        </ul>
      </div>
      
      <p>If you have any questions or need assistance, feel free to contact our support team.</p>
      
      <p>Thank you for choosing PornSpot.ai!</p>
    </div>
    
    <div class="footer">
      <p>© 2024 PornSpot.ai. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
Hello ${displayName},

🎉 Congratulations! Your email has been successfully verified and your PornSpot.ai account is now active.

You now have access to our premium adult content platform with cutting-edge AI-powered features.

Login here: ${loginUrl}

What you can do now:
- Browse our extensive collection of premium adult content
- Create and organize your personal albums
- Use AI-powered search and discovery features
- Access exclusive content and features
- Enjoy a personalized experience

If you have any questions or need assistance, feel free to contact our support team.

Thank you for choosing PornSpot.ai!

© 2024 PornSpot.ai. All rights reserved.
This is an automated email. Please do not reply to this message.
    `;

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Validate email configuration
   */
  static async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!this.DEFAULT_FROM_EMAIL) {
      errors.push("FROM_EMAIL environment variable is not set");
    }

    try {
      await ParameterStoreService.getSendGridApiKey();
    } catch (error) {
      errors.push("SendGrid API key is not configured properly");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
