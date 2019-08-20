import {BaselineState} from "../baseline/baseline";
import {BaselinePayload, PJNZUploaded, PJNZUploadError} from "../baseline/actions";
import {Mutation, MutationTree} from "vuex";

interface BaselineMutation extends Mutation<BaselineState> {
    payload?: BaselinePayload
}

export interface BaselineMutations {
    PJNZUploaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    BaselineDataLoaded: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZUploaded(state: BaselineState, action: PJNZUploaded) {
        state.pjnzError = "";
        state.pjnzFilename = action.payload.filename;
        state.country = action.payload.country;
        // TODO this step isn't really complete until all files are uploaded
        // but for now lets say it is
        state.complete = true;
    },

    PJNZUploadError(state: BaselineState, action: PJNZUploadError) {
        state.pjnzError = action.payload;
    }
}