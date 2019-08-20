<template>
    <div id="app" class="card login-form mx-auto mt-5">
        <div class="card-title">Forgotten your password?</div>
        <div class="card-body">
            <div class="form-group">
                <label for="email">Username</label>
                <input type="text" size="20" class="form-control" name="username" id="email" value="${email}">
            </div>
            <div class="text-center">
                <input class="btn btn-red" type="submit" value="Request password reset email" v-on:click="requestResetLink">
            </div>
            <error-alert v-if="hasError" :message="error"></error-alert>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import ErrorAlert from "./ErrorAlert.vue";
    import {api} from "../../apiService";
    import {mapActions, mapState} from "vuex";

    interface Data {
        email: string
    }

    interface Computed {
        hasError: boolean
    }

    interface Methods {
        handleFileSelect: (_: Event, files: FileList | null) => void
    }

    interface Props {
        initialEmail: string,
        error: string,
        requestLink: (email: string) => void,
    }

    export const forgotPassword = new Vue({
        el: "#forgot-password",
        name: "ForgotPassword",
        data(): Data {
            return {
                email: ""
            }
        },
        props: {
            initialEmail: String
        },
        computed: {
            hasError: function () {
                return this.error.length > 0
            }
        },
        methods: {
            ...mapActions({requestResetLink: 'password/requestResetLink'})
        },
        components: {
            ErrorAlert
        }
    });


</script>