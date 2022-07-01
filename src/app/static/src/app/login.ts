import Vue from "vue";
import Vuex, {StoreOptions} from "vuex";
import Login from "./components/Login.vue";
import {TranslatableState} from "./types";
import {initialLanguageState} from "./store/language/language";
import {actions} from './store/language/actions';
import {mutations} from './store/language/mutations';
import registerTranslations from "./store/translations/registerTranslations";

Vue.use(Vuex);

const loginStoreOptions: StoreOptions<TranslatableState> = {
    state: initialLanguageState,
    actions,
    mutations
};

const store = new Vuex.Store<TranslatableState>(loginStoreOptions);
registerTranslations(store);

export const loginApp = new Vue({
    el: "#app",
    store,
    components: {
        Login
    }
});
