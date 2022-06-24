import {LoginState} from "./login";
import {Mutation, MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";
import {mutations as languageMutations} from "../language/mutations";

type LoginMutation = Mutation<LoginState>

export interface LoginMutations {
    LoginRequested: LoginMutation
    // RequestResetLinkError: LoginMutation
    // ResetLogin: LoginMutation
    // ResetLoginError: LoginMutation
}

export const mutations: MutationTree<LoginState> & LoginMutations = {
    LoginRequested(state: LoginState) {
        state.loginRequested = true;
        state.loginRequestError = null;
    },

    // RequestResetLinkError(state: LoginState, action: PayloadWithType<Error>) {
    //     state.resetLinkRequested = false;
    //     state.requestResetLinkError = action.payload;
    // },

    // ResetLogin(state: LoginState) {
    //     state.loginWasReset = true;
    //     state.resetLoginError = null;
    // },

    // ResetLoginError(state: LoginState, action: PayloadWithType<Error>) {
    //     state.loginWasReset = false;
    //     state.resetLoginError = action.payload;
    // },

    ...languageMutations
};
