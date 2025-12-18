import 'server-only';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { getAccessToken } from './microsoft-graph-auth';
import 'isomorphic-fetch';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
}

export interface SendEmailOptions {
  from?: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  isHtml?: boolean;
  importance?: 'low' | 'normal' | 'high';
  attachments?: EmailAttachment[];
}

function getAuthenticatedClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

function formatRecipient(recipient: EmailRecipient) {
  return {
    emailAddress: {
      address: recipient.email,
      name: recipient.name || recipient.email,
    },
  };
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const client = getAuthenticatedClient(accessToken);

    const message: Message = {
      subject: options.subject,
      body: {
        contentType: options.isHtml ? 'html' : 'text',
        content: options.body,
      },
      toRecipients: options.to.map(formatRecipient),
      ccRecipients: options.cc?.map(formatRecipient),
      bccRecipients: options.bcc?.map(formatRecipient),
      importance: options.importance || 'normal',
    };

    if (options.attachments && options.attachments.length > 0) {
      message.attachments = options.attachments.map((att) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.name,
        contentType: att.contentType,
        contentBytes: att.contentBytes,
      }));
    }

    const sendMailBody = {
      message,
      saveToSentItems: true,
    };

    // Use the from address or default to 'me'
    const userPrincipalName = options.from || 'me';
    
    await client.api(`/users/${userPrincipalName}/sendMail`).post(sendMailBody);
  } catch (error) {
    console.error('Error sending email via Microsoft Graph:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function sendEmailOnBehalfOf(userEmail: string, options: SendEmailOptions): Promise<void> {
  return sendEmail({ ...options, from: userEmail });
}

export async function getDraftMessages(userEmail: string = 'me'): Promise<Message[]> {
  try {
    const accessToken = await getAccessToken();
    const client = getAuthenticatedClient(accessToken);

    const response = await client
      .api(`/users/${userEmail}/mailFolders/drafts/messages`)
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error fetching draft messages:', error);
    throw error;
  }
}

export async function getSentMessages(userEmail: string = 'me', top: number = 50): Promise<Message[]> {
  try {
    const accessToken = await getAccessToken();
    const client = getAuthenticatedClient(accessToken);

    const response = await client
      .api(`/users/${userEmail}/mailFolders/sentitems/messages`)
      .top(top)
      .orderby('sentDateTime DESC')
      .get();

    return response.value || [];
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    throw error;
  }
}
