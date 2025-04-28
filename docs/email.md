# Email Service

A wrapper around Resend's Node.js SDK for sending and scheduling emails.

## Features

- Send emails with HTML or plain text content
- Support for attachments
- CC and BCC recipients
- Schedule emails to be sent at a specific time
- Cancel scheduled emails

## Setup

1. Add the Resend API key to your environment SST secrets:

```bash
# In .env.dev or .env.prod
ResendApiKey=re_123456789
```

2. Make sure the `ResendApiKey` secret is defined in your SST configuration.

## Usage

### Sending an Email

```typescript
import { emailService } from '@utils/email';

// Simple usage
const result = await emailService.sendEmail({
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>This is a test email</p>',
});

if (result.success) {
  console.log(`Email sent with ID: ${result.id}`);
} else {
  console.error(`Failed to send email: ${result.error}`);
}

// Advanced usage
const result = await emailService.sendEmail({
  to: ['recipient1@example.com', 'recipient2@example.com'],
  subject: 'Hello',
  html: '<p>This is a <strong>formatted</strong> email</p>',
  text: 'This is a formatted email', // Plain text fallback
  from: 'custom@agenticteamos.com',
  cc: 'cc@example.com',
  bcc: ['bcc1@example.com', 'bcc2@example.com'],
  replyTo: 'reply@example.com',
  attachments: [
    {
      filename: 'report.pdf',
      content: Buffer.from('...'), // or base64 string
      contentType: 'application/pdf',
    },
  ],
});
```

### Scheduling an Email

```typescript
import { emailService } from '@utils/email';
import { randomUUID } from 'crypto';

// Schedule an email to be sent in 1 hour
const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);

const result = emailService.scheduleEmail({
  id: randomUUID(), // Unique ID for this scheduled email
  sendAt: oneHourLater,
  to: 'recipient@example.com',
  subject: 'Scheduled Email',
  html: '<p>This email was scheduled to be sent at a specific time</p>',
});

if (result.success) {
  console.log(`Email scheduled with ID: ${result.id}`);
} else {
  console.error(`Failed to schedule email: ${result.error}`);
}
```

### Canceling a Scheduled Email

```typescript
import { emailService } from '@utils/email';

const emailId = '123e4567-e89b-12d3-a456-426614174000';
const canceled = emailService.cancelScheduledEmail(emailId);

if (canceled) {
  console.log(`Email with ID ${emailId} was canceled`);
} else {
  console.log(`No scheduled email found with ID ${emailId}`);
}
```

### Getting All Scheduled Email IDs

```typescript
import { emailService } from '@utils/email';

const scheduledEmailIds = emailService.getScheduledEmailIds();
console.log(`There are ${scheduledEmailIds.length} scheduled emails`);
```

## Creating a Custom Instance

You can create a custom instance of the EmailService with your own API key and default sender:

```typescript
import { EmailService } from '@utils/email';

const customEmailService = new EmailService(
  'your-custom-api-key',
  'custom-sender@yourdomain.com'
);

// Use customEmailService just like the default instance
```

## Notes

- Scheduled emails are stored in memory, so they will be lost if the server restarts. For production use, consider implementing a persistent storage solution.
- The email service uses Resend as the email provider. Make sure your Resend account is properly configured. 