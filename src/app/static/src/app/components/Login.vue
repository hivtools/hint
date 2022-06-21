<template>
  <div>
    <!-- <logged-out-header :title="title"></logged-out-header> -->
      This is the Login component</div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ErrorAlert from "./ErrorAlert.vue";
    import {mapActions, mapState} from "vuex";
    import {LoginState} from "../store/login/login";
    import LoggedOutHeader from "./header/LoggedOutHeader.vue";
    import {Language} from "../store/translations/locales";

    export default Vue.extend({
        name: "Login",
        props: ["title"],
        data: () => {
            return {
                email: ""
            };
        },
        computed: mapState<LoginState>({
            error: (state: LoginState) => state.loginRequestError,
            hasError: (state: LoginState) => !!state.loginRequestError,
            // resetLinkRequested: (state: LoginState) => state.resetLinkRequested,
            language: (state: LoginState) => state.language
        }),
        // components: {
        //     ErrorAlert,
        //     LoggedOutHeader
        // },
        // methods: {
        //     ...mapActions({requestResetLink: 'requestResetLink'}),
        //     handleRequestResetLink: function (event: Event) {
        //         event.preventDefault();
        //         const form = this.$refs.forgotPasswordForm as HTMLFieldSetElement;
        //         if (form.checkValidity()) {
        //             this.requestResetLink(this.email);
        //         }
        //         form.classList.add('was-validated');
        //     }
        // },
        watch: {
            language(newVal: Language) {
                document.documentElement.lang = newVal
            }
        }
    });

</script>
