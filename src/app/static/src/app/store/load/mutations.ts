import {Mutation, MutationTree} from 'vuex';
import {LoadState} from "./load";
import {PayloadWithType} from "../../types";

type LoadMutation = Mutation<LoadState>

export interface BaselineMutations {
    LoadSucceeded: LoadMutation,
    LoadFailed: LoadMutation
}

export const mutations: MutationTree<LoadState> & BaselineMutations = {
    LoadSucceeded(state: LoadState) {
        state.loadError = "";
    },
    LoadFailed(state: LoadState, action: PayloadWithType<string>) {
        state.loadError = action.payload;
    }
}