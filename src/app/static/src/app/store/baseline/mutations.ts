import {Mutation, MutationTree} from 'vuex';
import {BaselinePayload} from "./actions";
import {BaselineState} from "./baseline";
import {PjnzResponse} from "../../generated";
import {BaselineData} from "../../types";

interface BaselineMutation extends Mutation<BaselineState> {
    payload?: BaselinePayload<any>
}

export interface BaselineMutations {
    PJNZUploaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    BaselineDataLoaded: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZUploaded(state: BaselineState, action: BaselinePayload<PjnzResponse>) {
        state.pjnzError = "";
        state.pjnzFilename = action.payload.filename;
        state.country = action.payload.data.country;
        // TODO this step isn't really complete until all files are uploaded
        // but for now lets say it is
        state.complete = true;
    },

    PJNZUploadError(state: BaselineState, action: BaselinePayload<string>) {
        state.pjnzError = action.payload;
    },

    BaselineDataLoaded(state: BaselineState, action: BaselinePayload<BaselineData>) {
        const data = action.payload;
        if (data.pjnz){
            state.country = data.pjnz.data.country;
            state.pjnzFilename = data.pjnz.filename;
            // TODO this step isn't really complete until all files are uploaded
            // but for now lets say it is
            state.complete = true;
         }
    }
};

