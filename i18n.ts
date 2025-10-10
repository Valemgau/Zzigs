import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// IMPORTS DIRECTS DES FICHIERS JSON
import fr from "./locales/fr/translation.json";
import en from "./locales/en/translation.json";
import de from "./locales/de/translation.json";
import es from "./locales/es/translation.json";
import it from "./locales/it/translation.json";

const STORE_LANGUAGE_KEY = "settings.lang";

const languageDetectorPlugin = {
  type: "languageDetector",
  async: true,
  init: () => {},
  detect: async function (callback) {
    try {
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then((language) => {
        if (language) {
          return callback(language);
        } else {
          return callback("fr");
        }
      });
    } catch (error) {
      console.log("Error reading language", error);
    }
  },
  cacheUserLanguage: async function (language) {
    try {
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {}
  },
};

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  it: { translation: it },
};

i18n
  .use(initReactI18next)
  .use(languageDetectorPlugin)
  .init({
    resources,
    compatibilityJSON: "v3",
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
