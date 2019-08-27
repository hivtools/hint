import {ActionContext, ActionPayload, ActionTree} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";

export type PasswordActionTypes = "ResetLinkRequested" | "RequestResetLinkError"

export interface PasswordPayload extends ActionPayload {
    type: PasswordActionTypes
}

export interface RequestResetLinkError extends PasswordPayload {
    payload: string
}

export interface PasswordActions {
    requestResetLink: (store: ActionContext<PasswordState, PasswordState>, email: string) => void
}

export const actions: ActionTree<PasswordState, PasswordState> & PasswordActions = {

    requestResetLink({commit}, email) {
        let formData = new FormData();
        formData.append('email', email);
        api.postAndReturn<null>("/password/request-reset-link/", formData)
            .then((payload) => {
                commit<PasswordPayload>({type: "ResetLinkRequested", payload});
            })
            .catch((error: Error) => {
                commit<PasswordPayload>({type: "RequestResetLinkError", payload: error.message});
            });
    }
};