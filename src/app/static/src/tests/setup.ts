import { RootState } from './../app/root';
import i18next from "i18next";
import { createApp } from "vue";
import Vuex from "vuex";
import {Language, locales} from "../app/store/translations/locales";
import {Hint} from "../app/Hint.vue";

// create mock element for app to attach to
const app = document.createElement('div');
app.setAttribute('id', 'app');
document.body.appendChild(app);

// implement innerText as its not implemented in jest/jsdom
// https://github.com/jsdom/jsdom/issues/1245
Object.defineProperty((global as any).Element.prototype, 'innerText', {
    get() {
        return this.textContent
    },
    set(value: string) {
        this.textContent = value
    },
    configurable: true
});

i18next.init({
    lng: Language.en,
    resources: {
        en: {translation: locales.en},
        fr: {translation: locales.fr},
        pt: {translation: locales.pt}
    },
    fallbackLng: Language.en
});

const vueApp = createApp(Hint);
const store = new Vuex.Store<RootState>({});
vueApp.use(store);

// Vue.use(Vuex);
// vueApp.config.performance = false;

global.console.error = (message: any) => {
    throw (message instanceof Error ? message : new Error(message))
}

process.on('unhandledRejection', (err) => {
    fail(err);
});
