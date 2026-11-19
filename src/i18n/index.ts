import { zhTW, type Translations } from './zh-TW';
import { en } from './en';

export type Locale = 'zh-TW' | 'en';

export function getTranslations(locale: Locale): Translations {
  return locale === 'en' ? en : zhTW;
}
