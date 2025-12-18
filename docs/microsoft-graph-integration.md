# Microsoft Graph & Outlook Email Integration

This document explains how to use the Microsoft Graph integration for sending emails via Outlook in the DigiLearn CRM.

## Features

- ✅ Send emails via Microsoft Graph API
- ✅ Support for CC, BCC recipients
- ✅ Email priority levels (low, normal, high)
- ✅ HTML and plain text email bodies
- ✅ File attachments support
- ✅ ACID-compliant database transactions
- ✅ Automatic activity logging for leads/deals
- ✅ Retrieve sent and draft emails

## Setup

### 1. Environment Variables

The following environment variables are already configured in `.env`:

```env
MICROSOFT_CLIENT_ID="your-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret"
MICROSOFT_TENANT_ID="common"
MICROSOFT_REDIRECT_URI="http://localhost:3000/integrations/outlook/callback"
```

### 2. Azure App Registration

Ensure your Azure AD app has the following permissions:
- `Mail.Send` - Send mail as a user
- `Mail.Read` - Read user mail
- `Mail.ReadWrite` - Read and write access to user mail

## Usage

### Frontend - Using the SendEmailModal Component

```tsx
import { SendEmailModal } from "~/components/modals/send-email-modal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Send Email</button>
      
      <SendEmailModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultTo={[{ email: "recipient@example.com", name: "John Doe" }]}
        leadId="lead-uuid" // Optional - for activity tracking
        dealId="deal-uuid" // Optional - for activity tracking
        onSuccess={() => console.log("Email sent!")}
      />
    </>
  );
}
```

### Backend - Using tRPC Mutation

```tsx
import { trpc } from "~/trpc/client";

function sendEmailExample() {
  const sendEmail = trpc.emailing.sendEmailViaGraph.useMutation({
    onSuccess: () => console.log("Email sent!"),
    onError: (error) => console.error(error),
  });

  sendEmail.mutate({
    to: [
      { email: "recipient@example.com", name: "John Doe" }
    ],
    cc: [
      { email: "cc@example.com" }
    ],
    subject: "Hello from DigiLearn CRM",
    body: "<p>This is a <strong>test email</strong></p>",
    isHtml: true,
    importance: "high",
    leadId: "lead-uuid", // Optional
    dealId: "deal-uuid", // Optional
  });
}
```

### Server-Side - Direct Service Usage

```tsx
import { sendEmail } from "~/lib/microsoft-graph-email";

async function sendEmailDirectly() {
  await sendEmail({
    to: [
      { email: "recipient@example.com", name: "John Doe" }
    ],
    subject: "Test Email",
    body: "This is a test email",
    isHtml: false,
    importance: "normal",
  });
}
```

## API Reference

### SendEmailInput Schema

```typescript
{
  from?: string;              // Optional sender email
  to: EmailRecipient[];       // Required: At least one recipient
  cc?: EmailRecipient[];      // Optional: CC recipients
  bcc?: EmailRecipient[];     // Optional: BCC recipients
  subject: string;            // Required: Email subject
  body: string;               // Required: Email body
  isHtml?: boolean;           // Default: true
  importance?: 'low' | 'normal' | 'high';  // Default: 'normal'
  attachments?: EmailAttachment[];  // Optional: File attachments
  leadId?: string;            // Optional: For activity tracking
  dealId?: string;            // Optional: For activity tracking
}
```

### EmailRecipient

```typescript
{
  email: string;    // Valid email address
  name?: string;    // Optional display name
}
```

### EmailAttachment

```typescript
{
  name: string;           // File name
  contentType: string;    // MIME type (e.g., 'application/pdf')
  contentBytes: string;   // Base64 encoded file content
}
```

## tRPC Endpoints

### `emailing.sendEmailViaGraph`
Sends an email via Microsoft Graph with ACID transaction support.

**Type:** Mutation  
**Input:** `SendEmailInput`  
**Output:** `{ success: boolean, message: string }`

### `emailing.getSentEmails`
Retrieves sent emails from the user's mailbox.

**Type:** Query  
**Input:** `{ userEmail?: string, limit?: number }`  
**Output:** `Message[]`

### `emailing.getDraftEmails`
Retrieves draft emails from the user's mailbox.

**Type:** Query  
**Input:** `{ userEmail?: string }`  
**Output:** `Message[]`

## ACID Compliance

The email sending process follows ACID principles:

1. **Atomicity**: All database operations (activity creation, email logging) and the email send operation are wrapped in a transaction
2. **Consistency**: If any step fails, the entire transaction is rolled back
3. **Isolation**: Database transactions are isolated from concurrent operations
4. **Durability**: Once committed, the email record persists in the database

## Database Schema

Emails are logged in the `emails` table with the following structure:

- Links to `leadActivities` for activity tracking
- References `leads` and `deals` for context
- Stores composer information
- Timestamps for auditing

## Error Handling

All errors are caught and returned as tRPC errors with appropriate error codes:

```typescript
try {
  await sendEmail(options);
} catch (error) {
  // Error is automatically handled and rolled back
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to send email",
  });
}
```

## Future Enhancements

- [ ] OAuth 2.0 delegated permissions (currently using client credentials)
- [ ] Email templates
- [ ] Scheduled emails
- [ ] Email tracking (open/click rates)
- [ ] Bulk email sending
- [ ] Email threading support
