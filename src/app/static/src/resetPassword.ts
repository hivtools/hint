import Vue from "vue";
import Vuex, {mapActions, StoreOptions} from "vuex";
import ResetPassword from "./components/password/ResetPassword.vue";
import {initialPasswordState, PasswordState} from "./store/password/password";
import {actions} from './store/password/actions';
import {mutations} from './store/password/mutations';
import registerTranslations from "./store/translations/registerTranslations";

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
    props: ["token", "title"],
    components: {
        ResetPassword
    },
    render: function (h) {
        return h(ResetPassword,
            {
                props: {
                    "token": this.$el.getAttribute("token"),
                    "title": this.$el.getAttribute("title")
                }
            });
    }
});
