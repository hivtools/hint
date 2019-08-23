import Vue from "vue";
import {mapActions, StoreOptions} from "vuex";
import ForgotPassword from "./components/password/ForgotPassword.vue";
import Vuex from "vuex";
import {initialPasswordState, PasswordState} from "./store/password/password";
import {actions} from './store/password/actions';
import {mutations} from './store/password/mutations';

Vue.use(Vuex);

const passwordStoreOptions: StoreOptions<PasswordState> = {
    state: initialPasswordState,
    actions: actions,
    mutations: mutations
};

const store = new Vuex.Store<PasswordState>(passwordStoreOptions);

export const resetPasswordApp = new Vue({
    el: "#app",
    store,
    components: {
        ResetPassword
    },
    render: h => h(ForgotPassword),
    methods: {
        ...mapActions({resetPassword: 'password/resetPassword'})
    }

});
