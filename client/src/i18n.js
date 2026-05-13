import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "welcome": "Welcome to My Retail Store",
          "buy": "Shop Now",
        }
      },
      km: {
        translation: {
          "welcome": "សូមស្វាគមន៍មកកាន់ហាងរបស់ខ្ញុំ",
          "buy": "ទិញឥឡូវនេះ",
        }
      }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;