import i18next from "i18next";
import {Language, locales} from "./locales";
import {Store} from "vuex";
import {TranslatableState} from "../../root";
import Vue from "vue";
import Translated from "../../components/Translated.vue";
import translate from "../../directives/translate";

export default <S extends TranslatableState>(store: Store<S>) => {
    i18next.init({
        lng: Language.en,
        resources: {
            en: {translation: locales.en},
            fr: {translation: locales.fr}
        },
        fallbackLng: Language.en
    });

    Vue.component('translated', Translated);

    // usage: v-translate:attribute="'keyName'"
    // e.g. v-translate:placeholder="'email'"
    Vue.directive('translate', translate(store));
}
