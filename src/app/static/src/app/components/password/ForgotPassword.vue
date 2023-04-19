<template>
    <div>
        <logged-out-header :title="title"></logged-out-header>
        <div class="card reset-password-form mx-auto mt-5">
            <div class="card-body">
                <h3 class="card-title" v-translate="'forgottenPassword'">
                </h3>
                <p v-translate="'forgottenPasswordHelp'">
                </p>
                <form ref="forgotPasswordForm" class="needs-validation" novalidate>
                    <div class="form-group">
                        <input type="email" class="form-control" name="email" id="email"
                               v-translate:placeholder="'email'"
                               v-model="email" required>
                        <div class="invalid-feedback" v-translate="'emailValidation'">
                        </div>
                    </div>
                    <div class="text-center">
                        <input class="btn btn-red"
                               type="submit"
                               v-translate:value="'requestReset'"
                               v-on:click="handleRequestResetLink"/>
                    </div>
                </form>
                <error-alert v-if="hasError" :error="error"></error-alert>
                <div v-if="resetLinkRequested"
                     class="alert alert-success mt-4"
                     role="alert"
                     v-translate="'resetLinkRequested'">
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import ErrorAlert from "../ErrorAlert.vue";
    import {mapActions, mapState} from "vuex";
    import {PasswordState} from "../../store/password/password";
    import LoggedOutHeader from "../header/LoggedOutHeader.vue";
    import {Language} from "../../store/translations/locales";
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import { mapStateProps } from "../../utils";

    interface Data {
        email: string
    }

    interface Computed {
        error: Error | null
        hasError: boolean
        resetLinkRequested: boolean,
        language: Language
    }

    interface Methods {
        requestResetLink: (email: string) => void
        handleRequestResetLink: (email: Event) => void
    }

    interface Props {
        title: string
    }

    export default defineComponentVue2WithProps<Data, Methods, Computed, Props>({
        name: "ForgotPassword",
        props: {
            title: {
                type: String,
                required: true
            }
        },
        data: () => {
            return {
                email: ""
            };
        },
        computed: {
        ...mapStateProps("password", {
            error: (state: PasswordState) => state.requestResetLinkError,
            hasError: (state: PasswordState) => !!state.requestResetLinkError,
            resetLinkRequested: (state: PasswordState) => state.resetLinkRequested,
            language: (state: PasswordState) => state.language
        })
        },
        components: {
            ErrorAlert,
            LoggedOutHeader
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
        },
        watch: {
            language(newVal: Language) {
                document.documentElement.lang = newVal
            }
        }
    });

</script>
