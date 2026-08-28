export const appConfig = {
  name: 'BIZMATE',
  tagline: 'The intelligent operating system for business',
  defaultLocale: 'en',
  supportedLocales: ['ar', 'en', 'tr', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh-CN', 'ja', 'ko'],
  modules: ['overview', 'intelligence', 'customers', 'projects', 'people', 'finance', 'automations', 'knowledge', 'reports', 'settings'],
} as const;

export type AppModule = typeof appConfig.modules[number];
