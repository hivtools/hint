import i18next from "i18next";
import Vue from "vue";
import Vuex from "vuex";
import {Language, locales} from "../app/store/translations/locales";

// create mock element for app to attach to
const app = document.createElement('div');
app.setAttribute('id', 'app');
document.body.appendChild(app);

i18next.init({
    lng: Language.en,
    resources: {
        en: { translation: locales.en },
        fr: { translation: locales.fr }
    },
    fallbackLng: Language.en
});

Vue.use(Vuex);
