import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { ParameterStoreService } from "./parameters";

const isLocal = process.env["AWS_SAM_LOCAL"] === "true";

const clientConfig: any = {};

if (isLocal) {
  clientConfig.endpoint = "http://pornspot-local-aws:4566";
  clientConfig.region = "us-east-1";
  clientConfig.credentials = {
    accessKeyId: "test",
    secretAccessKey: "test",
  };
}

const sesClient = new SESClient(clientConfig);

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
   * Send an email using Amazon SES
   */
  static async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    try {
      const fromEmail = options.fromEmail || this.DEFAULT_FROM_EMAIL;
      const fromName = options.fromName || this.DEFAULT_FROM_NAME;
      const source = `${fromName} <${fromEmail}>`;

      const command = new SendEmailCommand({
        Source: source,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.template.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: options.template.htmlBody,
              Charset: "UTF-8",
            },
            Text: {
              Data: options.template.textBody,
              Charset: "UTF-8",
            },
          },
        },
      });

      const result = await sesClient.send(command);

      console.log("Email sent successfully:", {
        messageId: result.MessageId,
        to: options.to,
        subject: options.template.subject,
      });

      return {
        success: true,
        ...(result.MessageId && { messageId: result.MessageId }),
      };
    } catch (error: any) {
      console.error("Failed to send email:", {
        error: error.message,
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
      verificationUrl
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
    verificationUrl: string
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
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #e11d48;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      margin-bottom: 30px;
    }
    .verify-button {
      display: inline-block;
      background-color: #e11d48;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .verify-button:hover {
      background-color: #be185d;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
    .token-info {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #6b7280;
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
      <p style="word-break: break-all; background-color: #f9fafb; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
      
      <div class="token-info">
        <strong>Important:</strong> This verification link will expire in 24 hours for security reasons. If you don't verify your email within this time, you'll need to request a new verification email.
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
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #e11d48;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      margin-bottom: 30px;
    }
    .login-button {
      display: inline-block;
      background-color: #e11d48;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .login-button:hover {
      background-color: #be185d;
    }
    .features {
      background-color: #f9fafb;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
    }
    .features h3 {
      color: #1f2937;
      margin-top: 0;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
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
  static validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.DEFAULT_FROM_EMAIL) {
      errors.push("FROM_EMAIL environment variable is not set");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
