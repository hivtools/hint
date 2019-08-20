import Vue from "vue";
import {store} from "./main"
import Stepper from "./components/Stepper.vue";
import ForgotPassword from "./components/password/ForgotPassword.vue";
import {mapActions, mapState} from "vuex";

export const app = new Vue({
    el: "#app",
    store,
    components: {
        Stepper
    },
    render: h => h(Stepper),
    methods: {
        ...mapActions({loadBaseline: 'baseline/getBaselineData'})
    },
    beforeMount: function() {
        this.loadBaseline()
    }
});


export const forgotPassword = new Vue({
    el: "#forgot-password",
    store,
    components: {
        ForgotPassword
    },
    render: h => h(ForgotPassword),
    methods: {
        ...mapActions({requestResetLink: 'password/requestResetLink'})
    }
});

