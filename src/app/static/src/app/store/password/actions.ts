import {ActionContext, ActionTree, Payload} from "vuex";
import {PasswordState} from "./password";
import {api} from "../../apiService";

export type PasswordActionTypes = "ResetLinkRequested" | "RequestResetLinkError" | "ResetPassword" | "ResetPasswordError"
export interface PasswordActionPayload<T> extends Payload {
    type: PasswordActionTypes
    payload: T
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
        api.postAndReturn<null>("/password/request-reset-link/", formData)
            .then((payload) => {
                commit<PasswordActionPayload<null>>({type: "ResetLinkRequested", payload: null});
            })
            .catch((error: Error) => {
                commit<PasswordActionPayload<string>>({type: "RequestResetLinkError", payload: error.message});
            });
    },

    resetPassword({commit}: ActionContext<PasswordState, PasswordState>, payload: ResetPasswordActionParams) {
        let formData = new FormData();
        formData.append('token', payload.token);
        formData.append('password', payload.password);
        api.postAndReturn<null>("/password/reset-password/", formData)
            .then((payload) => {
                commit<PasswordActionPayload<null>>({type: "ResetPassword", payload: null});
            })
            .catch((error: Error) => {
                commit<PasswordActionPayload<string>>({type: "ResetPasswordError", payload: error.message});
            });
    }
};