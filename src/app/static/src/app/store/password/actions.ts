import {ActionContext, ActionTree} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";
import qs from "qs";

export type PasswordActionTypes = "ResetLinkRequested" | "ResetPassword"
export type PasswordActionErrorTypes = "RequestResetLinkError" | "ResetPasswordError"

export interface ResetPasswordActionParams {
    token: string
    password: string
}

export interface PasswordActions {
    requestResetLink: (store: ActionContext<PasswordState, PasswordState>, email: string) => void
    resetPassword: (store: ActionContext<PasswordState, PasswordState>, payload: ResetPasswordActionParams) => void
}

export const actions: ActionTree<PasswordState, PasswordState> & PasswordActions = {

    async requestResetLink({commit}, email) {
        let formData = new FormData();
        formData.append('email', email);
        await api<PasswordActionTypes, PasswordActionErrorTypes>(commit)
            .withError("RequestResetLinkError")
            .withSuccess("ResetLinkRequested")
            .postAndReturn<Boolean>("/password/request-reset-link/", formData);
    },

    async resetPassword({commit}, payload) {
        await api<PasswordActionTypes, PasswordActionErrorTypes>(commit)
            .withError("ResetPasswordError")
            .withSuccess("ResetPassword")
            .postAndReturn<Boolean>("/password/reset-password/", qs.stringify({
                token: payload.token,
                password: payload.password
            }));
    }
};
