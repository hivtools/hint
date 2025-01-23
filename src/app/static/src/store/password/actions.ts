import {ActionContext, ActionTree} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";
import qs from "qs";
import {LanguageActions} from "../language/language";
import {changeLanguage} from "../language/actions";

export type PasswordActionTypes = "ResetLinkRequested" | "ResetPassword"
export type PasswordActionErrorTypes = "RequestResetLinkError" | "ResetPasswordError"

export interface ResetPasswordActionParams {
    token: string
    password: string
}

export interface PasswordActions extends LanguageActions<PasswordState> {
    requestResetLink: (store: ActionContext<PasswordState, PasswordState>, email: string) => void
    resetPassword: (store: ActionContext<PasswordState, PasswordState>, payload: ResetPasswordActionParams) => void
}

export const actions: ActionTree<PasswordState, PasswordState> & PasswordActions = {

    async requestResetLink(context, email) {
        await api<PasswordActionTypes, PasswordActionErrorTypes>(context)
            .withError("RequestResetLinkError")
            .withSuccess("ResetLinkRequested")
            .postAndReturn<boolean>("/password/request-reset-link/", qs.stringify({email: email}));
    },

    async resetPassword(context, payload) {
        await api<PasswordActionTypes, PasswordActionErrorTypes>(context)
            .withError("ResetPasswordError")
            .withSuccess("ResetPassword")
            .postAndReturn<boolean>("/password/reset-password/", qs.stringify({
                token: payload.token,
                password: payload.password
            }));
    },

    async changeLanguage(context, payload) {
        await changeLanguage<PasswordState>(context, payload)
    }
};
