import { en } from '@/locales/en';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof en>;

export function useTranslations() {
  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: unknown = en;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k];
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t };
}
