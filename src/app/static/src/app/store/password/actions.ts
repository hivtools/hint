import {ActionContext, ActionTree} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";

export type PasswordActionTypes = "ResetLinkRequested"
export type PasswordActionErrorTypes = "RequestResetLinkError"

export interface PasswordActions {
    requestResetLink: (store: ActionContext<PasswordState, PasswordState>, email: string) => void
}

export const actions: ActionTree<PasswordState, PasswordState> & PasswordActions = {

    async requestResetLink({commit}, email) {
        let formData = new FormData();
        formData.append('email', email);
        await api<PasswordActionTypes, PasswordActionErrorTypes>(commit)
            .withError("RequestResetLinkError")
            .withSuccess("ResetLinkRequested")
            .postAndReturn<Boolean>("/password/request-reset-link/", formData);
    }
};