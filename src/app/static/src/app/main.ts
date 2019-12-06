import Vue from 'vue';
import Vuex from 'vuex';
import {RootState, storeOptions} from "./root";
import i18next from "i18next";
import {Language, locales, Translations} from "./translations/locales";

Vue.use(Vuex);

i18next.init({
    lng: Language.en,
    resources: {
        en: { translation: locales.en },
        fr: { translation: locales.fr }
    },
    fallbackLng: Language.en
});

export const store = new Vuex.Store<RootState>(storeOptions);
