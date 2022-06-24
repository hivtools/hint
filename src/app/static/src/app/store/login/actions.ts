import {ActionContext, ActionTree} from "vuex";
import {LoginState} from "./login";
import {api} from "../../apiService";
import qs from "qs";
import {LanguageActions} from "../language/language";
import {changeLanguage} from "../language/actions";

export type LoginActionTypes = "ResetLinkRequested" | "ResetLogin"
export type LoginActionErrorTypes = "RequestResetLinkError" | "ResetLoginError"

export interface ResetLoginActionParams {
    token: string
    login: string
}

export interface LoginActions extends LanguageActions<LoginState> {
    requestResetLink: (store: ActionContext<LoginState, LoginState>, email: string) => void
    // resetLogin: (store: ActionContext<LoginState, LoginState>, payload: ResetLoginActionParams) => void
}

export const actions: ActionTree<LoginState, LoginState> & LoginActions = {

    async requestResetLink(context, email) {
        await api<LoginActionTypes, LoginActionErrorTypes>(context)
            .withError("RequestResetLinkError")
            .withSuccess("ResetLinkRequested")
            .postAndReturn<boolean>("/login/request-reset-link/", qs.stringify({email: email}));
    },

    // async resetLogin(context, payload) {
    //     await api<LoginActionTypes, LoginActionErrorTypes>(context)
    //         .withError("ResetLoginError")
    //         .withSuccess("ResetLogin")
    //         .postAndReturn<boolean>("/login/reset-login/", qs.stringify({
    //             token: payload.token,
    //             login: payload.login
    //         }));
    // },

    async changeLanguage(context, payload) {
        console.log("language action called", context, payload)
        await changeLanguage<LoginState>(context, payload)
    }
};
