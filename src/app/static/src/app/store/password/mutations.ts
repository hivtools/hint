import {PasswordState} from "./password";
import {Mutation, MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";

type PasswordMutation = Mutation<PasswordState>

export interface PasswordMutations {
    ResetLinkRequested: PasswordMutation
    RequestResetLinkError: PasswordMutation
    ResetPassword: PasswordMutation
    ResetPasswordError: PasswordMutation
}

export const mutations: MutationTree<PasswordState> & PasswordMutations = {
    ResetLinkRequested(state: PasswordState) {
        state.resetLinkRequested = true;
        state.requestResetLinkError = null;
    },

    RequestResetLinkError(state: PasswordState, action: PayloadWithType<Error>) {
        state.resetLinkRequested = false;
        state.requestResetLinkError = action.payload;
    },

    ResetPassword(state: PasswordState) {
        state.passwordWasReset = true;
        state.resetPasswordError = null;
    },

    ResetPasswordError(state: PasswordState, action: PayloadWithType<Error>) {
        state.passwordWasReset = false;
        state.resetPasswordError = action.payload;
    }
};
