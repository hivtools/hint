import {ActionContext, ActionTree, Commit, Payload} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";
import {Failure} from "../../generated";

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
        let formData = new FormData();
        formData.append('email', email);
        const success = await api()
            .commitFirstError(commit, "RequestResetLinkError")
            .postAndReturn<any>("/password/request-reset-link/", formData);

        success && commit<PasswordActionPayload<null>>({type: "ResetLinkRequested", payload: null});
    }

};