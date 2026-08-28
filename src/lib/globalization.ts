export const supportedLocales = ['ar','en','tr','fr','de','es','it','pt','ru','zh-CN','ja','ko','hi','id','nl','pl','uk','vi','th','sv','no','da','fi','el','he'] as const;
export type SupportedLocale = typeof supportedLocales[number];

export const localeDirection: Record<SupportedLocale, 'ltr' | 'rtl'> = {
  ar:'rtl', en:'ltr', tr:'ltr', fr:'ltr', de:'ltr', es:'ltr', it:'ltr', pt:'ltr', ru:'ltr', 'zh-CN':'ltr', ja:'ltr', ko:'ltr', hi:'ltr', id:'ltr', nl:'ltr', pl:'ltr', uk:'ltr', vi:'ltr', th:'ltr', sv:'ltr', no:'ltr', da:'ltr', fi:'ltr', el:'ltr', he:'rtl'
};

export const supportedCurrencies = ['USD','EUR','GBP','TRY','SAR','AED','CAD','AUD','JPY','CNY','INR'] as const;
export type SupportedCurrency = typeof supportedCurrencies[number];

export function directionForLocale(locale: SupportedLocale) { return localeDirection[locale]; }
