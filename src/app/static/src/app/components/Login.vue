<template>
    <div>
        <logged-out-header :title="appTitle"></logged-out-header>
        <a href="https://www.unaids.org"><img src="public/images/unaids_logo.png" class="large-logo mx-auto mt-5 mb-4"/></a>
        <h1 class="text-center"><strong>{{appTitle}}</strong></h1>
        <div id="app" class="card login-form mx-auto mt-3">
            <div class="card-body">
                <form id="login-form" ref="loginForm" method="post" action="/callback" class="needs-validation" novalidate>
                    <div class="form-group">
                        <label id="userid-label" for="user-id" v-translate="'usernameEmail'"></label>
                        <input type="text" size="20" class="form-control" name="username" id="user-id" v-model.trim="email" required>
                        <div id="userid-feedback" class="invalid-feedback" v-translate="'usernameValidation'"></div>
                    </div>
                    <div class="form-group">
                        <label id="pw-id-label" for="pw-id" v-translate="'password'"></label>
                        <input type="password" size="20" class="form-control" name="password" id="pw-id" required>
                        <div id="pw-feedback" class="invalid-feedback" v-translate="'passwordValidation'"></div>
                        <div id="forgot-password">
                            <a href="/password/forgot-password/" v-translate="'forgottenPassword'"></a>
                        </div>
                    </div>
                    <div class="text-center mt-2">
                        <!-- <input @click="handleLoginSubmit" class="btn btn-red" type="submit" v-translate:value="'logIn'"> -->
                        <button @click.prevent="handleLoginSubmit" class="btn btn-red" type="submit" v-translate="'logIn'"></button>
                    </div>
                </form>
                <error-alert v-if="hasError" :error="error"></error-alert>
                <!-- <#if error != "">
                    <div id="error" class="alert alert-danger mt-3">${error}</div>
                </#if> -->
                <div id="register-an-account" class="text-center mt-4">
                    <!-- Don't have an account? <br><a href="https://forms.office.com/r/7S9EMigGr4" target="_blank">Request an account</a> -->
                    <div v-translate="'noAccount'"></div>
                    <a href="https://forms.office.com/r/7S9EMigGr4" target="_blank" id="requestAccount" v-translate="'requestAccount'"></a>
                </div>
            </div>
        </div>
        <div id="continue-as-guest" class="text-center mt-3">
            <div class="mb-3" v-translate="'orCaps'"></div>
            <a class="btn btn-red" @click="continueAsGuest" type="submit" :href="continueTo" v-translate="'continueGuest'"></a>
        </div>
            <div id="partner-logos" class="logos mx-auto mt-5">
            <a href="https://www.fjelltopp.org"><img src="public/images/fjelltopp_logo.png" class="small-logo"></a>
            <a href="https://www.imperial.ac.uk"><img src="public/images/imperial_logo.png" class="small-logo"></a>
            <a href="https://github.com/reside-ic"><img src="public/images/reside_logo.png" class="small-logo"></a>
            <a href="https://www.avenirhealth.org"><img src="public/images/avenir_logo.png" class="small-logo"></a>
            <a href="https://www.washington.edu"><img src="public/images/uw_logo.png" class="small-logo"></a>
        </div>
    </div>
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
        props: ["title", "appTitle", "username", "continueTo", "error"],
        data: () => {
            return {
                email: "",
            };
        },
        computed: mapState<LoginState>({
            error2: (state: LoginState) => state.loginRequestError,
            hasError: (state: LoginState) => !!state.loginRequestError,
            language: (state: LoginState) => state.language
        }),
        components: {
            ErrorAlert,
            LoggedOutHeader
        },
        mounted(){
            this.email = this.username
        },
        methods: {
            ...mapActions({loginRequest: 'loginRequest'}),
            handleLoginSubmit() {
                const loginForm = this.$refs.loginForm as HTMLFormElement

                // if (loginForm.checkValidity()) {
                //     this.loginRequest(this.email);
                // }
                if (loginForm && !loginForm.checkValidity()) {
                    loginForm.classList.add('was-validated');
                }
            },
            continueAsGuest() {
                sessionStorage.setItem("asGuest", "continueAsGuest")
            }
        },
        watch: {
            language(newVal: Language) {
                document.documentElement.lang = newVal
            }
        }
    });

</script>
