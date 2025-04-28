import { Resend } from 'resend';
import { Resource } from 'sst';

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Email options interface
 */
export interface EmailOptions {
  /** Email recipient(s) */
  to: string | string[];
  /** Email subject */
  subject: string;
  /** Email content (HTML) */
  html?: string;
  /** Email content (plain text) */
  text?: string;
  /** Email sender address (defaults to configured from address) */
  from?: string;
  /** Email CC recipients */
  cc?: string | string[];
  /** Email BCC recipients */
  bcc?: string | string[];
  /** Email reply-to address */
  replyTo?: string;
  /** Email attachments */
  attachments?: EmailAttachment[];
}

/**
 * Scheduled email interface
 */
export interface ScheduledEmail extends EmailOptions {
  /** Unique ID for the scheduled email */
  id: string;
  /** When to send the email (ISO string or Date object) */
  sendAt: string | Date;
}

/**
 * Email service response interface
 */
export interface EmailResponse {
  /** Whether the email was sent successfully */
  success: boolean;
  /** Email ID if successful */
  id?: string;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Email service class for sending emails via Resend
 */
export class EmailService {
  private resend: Resend;
  private defaultFrom: string;
  private scheduledEmails: Map<string, string>; // Store Resend email IDs instead of timeouts

  /**
   * Creates a new EmailService instance
   * @param apiKey Optional Resend API key (defaults to SST Resource)
   * @param defaultFrom Optional default from address
   */
  constructor(
    apiKey?: string,
    defaultFrom = 'notifications@updates.agenticteamos.com'
  ) {
    this.resend = new Resend(apiKey || process.env.RESEND_API_KEY);
    this.defaultFrom = defaultFrom;
    this.scheduledEmails = new Map();
  }

  /**
   * Sends an email
   * @param options Email options
   * @returns Email response
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Create email payload, ensuring we have either html or text
      const payload: any = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject
      };

      // Ensure we have at least html or text content
      if (options.html) {
        payload.html = options.html;
      } else if (options.text) {
        payload.text = options.text;
      } else {
        return {
          success: false,
          error: 'Either html or text content is required'
        };
      }

      // Add optional fields if provided
      if (options.cc) payload.cc = options.cc;
      if (options.bcc) payload.bcc = options.bcc;
      if (options.replyTo) payload.reply_to = options.replyTo;
      if (options.attachments) payload.attachments = options.attachments;

      const { data, error } = await this.resend.emails.send(payload);
  
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }
  
      return {
        success: true,
        id: data?.id
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Schedules an email to be sent at a specific time using Resend's native scheduling
   * @param options Scheduled email options
   * @returns Email response with scheduled ID
   */
  async scheduleEmail(options: ScheduledEmail): Promise<EmailResponse> {
    try {
      const { id, sendAt, ...emailOptions } = options;
      
      // Create email payload similar to sendEmail
      const payload: any = {
        from: emailOptions.from || this.defaultFrom,
        to: emailOptions.to,
        subject: emailOptions.subject,
        scheduledAt: typeof sendAt === 'string' ? sendAt : sendAt.toISOString()
      };

      // Ensure we have at least html or text content
      if (emailOptions.html) {
        payload.html = emailOptions.html;
      } else if (emailOptions.text) {
        payload.text = emailOptions.text;
      } else {
        return {
          success: false,
          error: 'Either html or text content is required'
        };
      }

      // Add optional fields if provided
      if (emailOptions.cc) payload.cc = emailOptions.cc;
      if (emailOptions.bcc) payload.bcc = emailOptions.bcc;
      if (emailOptions.replyTo) payload.reply_to = emailOptions.replyTo;
      if (emailOptions.attachments) payload.attachments = emailOptions.attachments;

      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'No data returned from email service'
        };
      }

      // Store the Resend email ID with our custom ID
      this.scheduledEmails.set(id, data.id);

      return {
        success: true,
        id
      };
    } catch (error) {
      console.error('Error scheduling email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Cancels a scheduled email
   * @param id ID of the scheduled email
   * @returns Whether the cancellation was successful
   */
  async cancelScheduledEmail(id: string): Promise<boolean> {
    try {
      const resendId = this.scheduledEmails.get(id);
      if (!resendId) {
        return false;
      }

      await this.resend.emails.cancel(resendId);
      this.scheduledEmails.delete(id);
      return true;
    } catch (error) {
      console.error('Error canceling scheduled email:', error);
      return false;
    }
  }

  /**
   * Gets all scheduled email IDs
   * @returns Array of scheduled email IDs
   */
  getScheduledEmailIds(): string[] {
    return Array.from(this.scheduledEmails.keys());
  }
}

// Export a singleton instance for convenience
export const emailService = new EmailService(); 