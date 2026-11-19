import {Language} from "./store/translations/locales";

export class LocalStorageManager {

    saveLanguage = (lang: Language) => {
        localStorage.setItem("language", lang);
    }

    getLanguage = (): Language => {
        const storedLang = localStorage.getItem("language")
        return storedLang ? storedLang as Language : Language.en;
    }

    // The working state used to be kept here, shared by every tab. It is kept per tab in sessionStorage now
    // (see sessionStorageManager.ts), so remove what earlier versions left behind.
    removeLegacyState = () => {
        Object.keys(localStorage)
            .filter((key) => key === "user" || key.startsWith("hintAppState_v"))
            .forEach((key) => localStorage.removeItem(key));
    }
}

export const localStorageManager = new LocalStorageManager();
