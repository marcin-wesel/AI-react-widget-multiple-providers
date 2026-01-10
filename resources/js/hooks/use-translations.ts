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
    let value: any = en;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value ?? key;
  };

  return { t };
}
