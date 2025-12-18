import 'server-only';
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
};

let msalInstance: ConfidentialClientApplication | null = null;

export function getMsalInstance(): ConfidentialClientApplication {
  if (!msalInstance) {
    msalInstance = new ConfidentialClientApplication(msalConfig);
  }
  return msalInstance;
}

export async function getAccessToken(scopes: string[] = ['https://graph.microsoft.com/.default']): Promise<string> {
  const msalClient = getMsalInstance();
  
  const tokenRequest = {
    scopes,
  };

  try {
    const response = await msalClient.acquireTokenByClientCredential(tokenRequest);
    if (!response || !response.accessToken) {
      throw new Error('Failed to acquire access token');
    }
    return response.accessToken;
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
}

export async function getAccessTokenForUser(userId: string, scopes: string[] = ['Mail.Send']): Promise<string> {
  // This is for delegated permissions - you'll need to implement OAuth flow
  // For now, using client credentials
  return getAccessToken(['https://graph.microsoft.com/.default']);
}
