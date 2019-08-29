import {ActionContext, ActionTree, Payload} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";
import qs from "qs";

export type PasswordActionTypes = "ResetLinkRequested" | "RequestResetLinkError"

export interface PasswordActionPayload<T> extends Payload {
    type: PasswordActionTypes
    payload: T
}

export interface PasswordActions {
    requestResetLink: (store: ActionContext<PasswordState, PasswordState>, email: string) => void
}

export const actions: ActionTree<PasswordState, PasswordState> & PasswordActions = {

    async requestResetLink({commit}, email) {
        const success = await api()
            .commitFirstErrorAsType(commit, "RequestResetLinkError")
            .postAndReturn<Boolean>("/password/request-reset-link/", qs.stringify({email: email}));

        success && commit<PasswordActionPayload<null>>({type: "ResetLinkRequested", payload: null});
    }
};