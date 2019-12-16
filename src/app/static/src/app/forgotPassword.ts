import Vue from "vue";
import {mapActions, StoreOptions} from "vuex";
import ForgotPassword from "./components/password/ForgotPassword.vue";
import LoggedOutHeader from "./components/header/LoggedOutHeader.vue";
import Vuex from "vuex";
import {initialPasswordState, PasswordState} from "./store/password/password";
import {actions} from './store/password/actions';
import {mutations} from './store/password/mutations';
import {actions as languageActions} from './store/language/actions';
import {mutations as languageMutations} from './store/language/mutations';
import registerTranslations from "./store/translations/registerTranslations";

Vue.use(Vuex);

const passwordStoreOptions: StoreOptions<PasswordState> = {
    state: initialPasswordState,
    actions: {...actions, ...languageActions()},
    mutations: {...mutations, ...languageMutations}
};

const store = new Vuex.Store<PasswordState>(passwordStoreOptions);
registerTranslations(store);

export const forgotPasswordApp = new Vue({
    el: "#app",
    store,
    components: {
        ForgotPassword,
        LoggedOutHeader
    },
    methods: {
        ...mapActions({requestResetLink: 'password/requestResetLink'})
    }

});
