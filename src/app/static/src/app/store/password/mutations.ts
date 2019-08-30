import {PasswordState} from "./password";
import {Mutation, MutationTree} from "vuex";
import {PayloadWithType} from "../../types";

type PasswordMutation = Mutation<PasswordState>

export interface PasswordMutations {
    ResetLinkRequested:PasswordMutation
    RequestResetLinkError: PasswordMutation
}

export const mutations: MutationTree<PasswordState> & PasswordMutations = {
    ResetLinkRequested(state: PasswordState) {
        state.resetLinkRequested = true;
        state.requestResetLinkError = "";
    },

    RequestResetLinkError(state: PasswordState, action: PayloadWithType<string>) {
        state.resetLinkRequested = false;
        state.requestResetLinkError = action.payload;
    }
};
