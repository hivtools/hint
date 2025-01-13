import i18next from "i18next";
import {Language, locales} from "../../../src/store/translations/locales";

i18next.init({
    lng: Language.en,
    resources: {
        en: { translation: locales.en },
        fr: { translation: locales.fr },
        pt: { translation: locales.pt },
    },
    fallbackLng: Language.en,
});

export function translate(key: string): string {
    return i18next.t(key, {lng: Language.en})
}
