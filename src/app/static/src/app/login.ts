import Vue from "vue";
import Vuex, {StoreOptions} from "vuex";
import Login from "./components/Login.vue";
import {Language} from "./store/translations/locales";
import {TranslatableState} from "./types";
import {initialLanguageState} from "./store/language/language";
// import {initialLoginState, LoginState} from "./store/login/login";
import {actions} from './store/language/actions';
import {mutations} from './store/language/mutations';
// import {actions} from './store/login/actions';
// import {mutations} from './store/login/mutations';
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
    props: ["title", "appTitle", "username", "continueTo", "error"],
    components: {
        Login
    },
    render: function (h) {
        return h(Login, {
            props: {
                "title": this.$el.getAttribute("title"),
                "appTitle": this.$el.getAttribute("app-title"),
                "username": this.$el.getAttribute("username"),
                "continueTo": this.$el.getAttribute("continue-to"),
                "error": this.$el.getAttribute("error"),
            }
        })
    }
});
