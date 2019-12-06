import i18next from "i18next";
import {locales, Translations} from "../app/translations/locales";
import Vue from "vue";
import Vuex from "vuex";

// create mock element for app to attach to
const app = document.createElement('div');
app.setAttribute('id', 'app');
document.body.appendChild(app);

i18next.init({
    lng: "en",
    resources: {
        en: { translation: locales.en },
        fr: { translation: locales.fr }
    },
    fallbackLng: "en"
});

Vue.use(Vuex);
