import {PasswordState} from "./password";
import {PasswordPayload, ResetLinkRequested, RequestResetLinkError, ResetPassword, ResetPasswordError} from "./actions";
import {Mutation, MutationTree} from "vuex";

interface PasswordMutation extends Mutation<PasswordState> {
    payload?: PasswordPayload
}

export interface PasswordMutations {
    ResetLinkRequested:PasswordMutation
    RequestResetLinkError: PasswordMutation
    ResetPassword: PasswordMutation
    ResetPasswordError: PasswordMutation
}

export const mutations: MutationTree<PasswordState> & PasswordMutations = {
    ResetLinkRequested(state: PasswordState, action: ResetLinkRequested) {
        state.resetLinkRequested = true;
        state.requestResetLinkError = "";
    },

    RequestResetLinkError(state: PasswordState, action: RequestResetLinkError) {
        state.resetLinkRequested = false;
        state.requestResetLinkError = action.payload;
    },

    ResetPassword(state: PasswordState, action: ResetPassword) {
        state.passwordWasReset = true;
        state.resetPasswordError = "";
    },

    ResetPasswordError(state: PasswordState, action: RequestResetLinkError) {
        state.passwordWasReset= false;
        state.resetPasswordError = action.payload;
    }
}