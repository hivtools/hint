import {Mutation, MutationTree} from 'vuex';
import {BaselinePayload, PJNZLoaded, PJNZUploadError} from "./actions";
import {BaselineState} from "./baseline";

interface BaselineMutation extends Mutation<BaselineState> {
    payload?: BaselinePayload
}

export interface BaselineMutations {
    PJNZLoaded: BaselineMutation
    PJNZUploadError: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZLoaded(state: BaselineState, action: PJNZLoaded) {
        state.pjnzError = "";
        state.country = action.payload.country;
        // TODO this step isn't really complete until all files are uploaded
        // but for now lets say it is
        state.complete = true;
    },

    PJNZUploadError(state: BaselineState, action: PJNZUploadError) {
        state.pjnzError = action.payload;
    }
};

