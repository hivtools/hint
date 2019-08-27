import {ActionContext, ActionPayload, ActionTree} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";

export type PasswordActionTypes = "ResetLinkRequested" | "RequestResetLinkError" |
    "ResetPassword" | "ResetPasswordError"

export interface PasswordPayload extends ActionPayload {
    type: PasswordActionTypes
}

export interface ResetLinkRequested extends PasswordPayload {
    payload: null
}

export interface RequestResetLinkError extends PasswordPayload {
    payload: string
}

export interface ResetPassword extends PasswordPayload {
    payload: null
}

export interface ResetPasswordError extends PasswordPayload {
    payload: string
}

export interface ResetPasswordActionParams {
    token: string
    password: string
}

export interface PasswordActions {
    requestResetLink: (store: ActionContext<PasswordState, PasswordState>, email: string) => void
    resetPassword: (store: ActionContext<PasswordState, PasswordState>, payload: ResetPasswordActionParams) => void
}

export const actions: ActionTree<PasswordState, PasswordState> & PasswordActions = {

    requestResetLink({commit}: ActionContext<PasswordState, PasswordState>, email: string) {
        let formData = new FormData();
        formData.append('email', email);
        api.postAndReturn<string>("/password/request-reset-link/", formData)
            .then((payload) => {
                commit<PasswordPayload>({type: "ResetLinkRequested", payload: null});
            })
            .catch((error: Error) => {
                commit<PasswordPayload>({type: "RequestResetLinkError", payload: error.message});
            });
    },

    resetPassword({commit}: ActionContext<PasswordState, PasswordState>, payload: ResetPasswordActionParams) {
        let formData = new FormData();
        formData.append('token', payload.token);
        formData.append('password', payload.password);
        api.postAndReturn<string>("/password/reset-password/", formData)
            .then((payload) => {
                commit<PasswordPayload>({type: "ResetPassword", payload: null});
            })
            .catch((error: Error) => {
                commit<PasswordPayload>({type: "ResetPasswordError", payload: error.message});
            });
    }
};