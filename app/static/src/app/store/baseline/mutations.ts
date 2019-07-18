import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "../../types";
import {BaselinePayload, PJNZLoaded} from "./actions";

interface BaselineMutation extends Mutation<BaselineState> {
    payload?: BaselinePayload
}

export interface BaselineMutations {
    PJNZLoaded: BaselineMutation
    PJNZLoadError: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZLoaded(state: BaselineState, action: PJNZLoaded) {
        state.hasError = false;
        state.country = action.payload.country
    },

    PJNZLoadError(state: BaselineState) {
        state.hasError = true;
    }
};

