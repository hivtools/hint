<template>
    <div class="card reset-password-form mx-auto mt-5">
        <div class="card-body">
            <h3 class="card-title">Forgotten your password?</h3>
            <p>
                If you've forgotten your password, enter your email address to request a link which you can use
                to create a new password.
            </p>
            <form id="forgot-password-form">
                <div class="form-group">
                    <label for="email">Email address</label>
                    <input type="email" class="form-control" name="email" id="email" v-model="email" required>
                </div>

                <div class="text-center">
                    <input class="btn btn-red" type="submit" value="Request password reset email"
                           v-on:click="handleRequestResetLink">
                </div>
            </form>
            <error-alert v-if="hasError" :message="error"></error-alert>
            <div v-if="resetLinkRequested" class="alert alert-success mt-4" role="alert">
                Thank you. If we have an account registered for this email address, you wil receive a password reset link.
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {mapActions, mapState} from "vuex";
    import {PasswordState} from "../../store/password/password";

    const namespace: string = 'password';

    export default Vue.extend({
        name: "ForgotPassword",
        data: () => {
            return {
                email: ""
            };
        },
        computed: mapState<PasswordState>(namespace, {
            error: state => state.requestResetLinkError,
            hasError:  state => state.requestResetLinkError && state.requestResetLinkError.length > 0,
            resetLinkRequested: state => state.resetLinkRequested
        }),
       components: {
            ErrorAlert
        },
        methods: {
            ...mapActions({requestResetLink: 'password/requestResetLink'}),
            handleRequestResetLink: function(event: Event){
                const form = document.getElementById("forgot-password-form") as HTMLFieldSetElement;
                if (form.checkValidity()) {
                    event.preventDefault();
                    this.requestResetLink(this.email);
                }
            }
        }
    });


</script>