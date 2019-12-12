<template>
    <div class="card reset-password-form mx-auto mt-5">
        <div class="card-body">
            <h3 class="card-title">
                <translated text-key="forgottenPassword"></translated>
            </h3>
            <p>
                <translated text-key="forgottenPasswordHelp"></translated>
            </p>
            <form ref="forgotPasswordForm" class="needs-validation" novalidate>
                <div class="form-group">
                    <input type="email" class="form-control" name="email" id="email"
                           v-translate:placeholder="'email'"
                           v-model="email" required>
                    <div class="invalid-feedback">
                        <translated text-key="emailValidation"></translated>
                    </div>
                </div>
                <div class="text-center">
                    <button class="btn btn-red" type="submit"
                            v-on:click="handleRequestResetLink">
                        <translated text-key="requestReset"></translated>
                    </button>
                </div>
            </form>
            <error-alert v-if="hasError" :error="error"></error-alert>
            <div v-if="resetLinkRequested" class="alert alert-success mt-4" role="alert">
                <translated text-key="resetLinkRequested"></translated>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {mapActions, mapState} from "vuex";
    import {PasswordState} from "../../store/password/password";

    export default Vue.extend({
        name: "ForgotPassword",
        data: () => {
            return {
                email: ""
            };
        },
        computed: mapState<PasswordState>({
            error: state => state.requestResetLinkError,
            hasError: state => !!state.requestResetLinkError,
            resetLinkRequested: state => state.resetLinkRequested
        }),
        components: {
            ErrorAlert
        },
        methods: {
            ...mapActions({requestResetLink: 'requestResetLink'}),
            handleRequestResetLink: function (event: Event) {
                event.preventDefault();
                const form = this.$refs.forgotPasswordForm as HTMLFieldSetElement;
                if (form.checkValidity()) {
                    this.requestResetLink(this.email);
                }
                form.classList.add('was-validated');
            }
        }
    });


</script>