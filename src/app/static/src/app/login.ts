import Vue from "vue";
import Vuex, {StoreOptions} from "vuex";
import LoggedOutHeader from "./components/header/LoggedOutHeader.vue";
import registerTranslations from "./store/translations/registerTranslations";
import {TranslatableState} from "./root";
import {actions as languageActions} from "./store/language/actions";
import {mutations as languageMutations} from "./store/language/mutations";
import {Language} from "./store/translations/locales";

Vue.use(Vuex);

const loginStoreOptions: StoreOptions<TranslatableState> = {
    state: {language: Language.en},
    actions: {...languageActions()},
    mutations: {...languageMutations}
};

const store = new Vuex.Store<TranslatableState>(loginStoreOptions);
registerTranslations(store);

export const loginApp = new Vue({
    el: "#app",
    store,
    components: {
        LoggedOutHeader
    }
});
