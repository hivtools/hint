import Vue from 'vue';
import Vuex from 'vuex';
import {RootState, storeOptions} from "./root";
import {Language, locales} from "./store/translations/locales";
import i18next from "i18next";

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
