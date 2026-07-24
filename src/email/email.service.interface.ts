export interface EmailService {
  sendInvite(to: string, orgName: string, link: string): Promise<void>;
  sendPasswordReset(to: string, link: string): Promise<void>;
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
