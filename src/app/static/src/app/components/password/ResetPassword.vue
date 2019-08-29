<template>
    <div class="card reset-password-form mx-auto mt-5">
        <div class="card-body">
            <h3 class="card-title">Enter a new password</h3>
            <div v-if="!passwordWasReset" >
                <form ref="resetPasswordForm" class="needs-validation" novalidate>
                    <div class="form-group">
                        <input type="password" class="form-control" name="password" id="email" placeholder="New password"
                               v-model="password" required>
                        <div class="invalid-feedback">Please enter a new password.</div>
                    </div>

                    <div class="text-center">
                        <input class="btn btn-red" type="submit" value="Update password"
                               v-on:click="handleResetPassword">
                    </div>
                </form>
                <div v-if="hasError">
                    <error-alert :message="error"></error-alert>
                    <div id="request-new-link">
                        This password reset link is not valid. It may have expired or already been used.
                        Please request another link <a href="/password/forgot-password">here</a>.
                    </div>
                </div>
            </div>
            <div v-if="passwordWasReset" id="password-was-reset">
                Thank you, your password has been updated. Click <a href="/">here</a> to login.
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
        name: "ResetPassword",
        props: ["token"],
        data: () => {
            return {
                password: ""
            };
        },
        computed: mapState<PasswordState>( {
            error: state => state.resetPasswordError,
            hasError:  state => state.resetPasswordError && state.resetPasswordError.length > 0,
            passwordWasReset: state => state.passwordWasReset
        }),
        components: {
            ErrorAlert
        },
        methods: {
            ...mapActions({resetPassword: 'resetPassword'}),
            handleResetPassword: function(event: Event){
                event.preventDefault();
                const form = this.$refs.resetPasswordForm as HTMLFieldSetElement;
                if (form.checkValidity()) {
                    this.resetPassword({token: this.token, password: this.password});
                }
                form.classList.add('was-validated');
            }
        }
    });


</script>