export type AuthProvider = 'email_password' | 'google' | 'microsoft';

export interface AuthProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: AuthProvider;
  organizationId?: string;
  role?: 'owner' | 'admin' | 'manager' | 'employee';
  onboardingComplete: boolean;
}

export interface OrganizationSetup {
  companyName: string;
  industry: string;
  country: string;
  currency: string;
  timezone: string;
  locale: string;
}
