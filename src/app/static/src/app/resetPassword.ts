import Vue from "vue";
import {StoreOptions} from "vuex";
import ResetPassword from "./components/password/ResetPassword.vue";
import Vuex from "vuex";
import {initialPasswordState, PasswordState} from "./store/password/password";
import {actions} from './store/password/actions';
import {mutations} from './store/password/mutations';
import registerTranslations from "./store/translations/registerTranslations";
import LoggedOutHeader from "./components/header/LoggedOutHeader.vue";

Vue.use(Vuex);

const passwordStoreOptions: StoreOptions<PasswordState> = {
    state: initialPasswordState,
    actions: actions,
    mutations: mutations
};

const store = new Vuex.Store<PasswordState>(passwordStoreOptions);
registerTranslations(store);

export const resetPasswordApp = new Vue({
    el: "#app",
    store,
    props: ["token"],
    components: {
        ResetPassword,
        LoggedOutHeader
    }
});
