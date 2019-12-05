import i18next from "i18next";
import {locales, Translations} from "./locales";
import Vue from "vue";

i18next.init({
    lng: "en",
    resources: {
        en: { translation: locales.en },
        fr: { translation: locales.fr }
    },
    fallbackLng: "en"
});
//
// export const i18n = new VueI18Next(i18next);
//
// Vue.use(VueI18Next);

Vue.filter("t", (value: keyof Translations) => {
    return i18next.t(value);
});
