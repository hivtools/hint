import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {PjnzResponse} from "../../generated";
import {PayloadWithType} from "../../types";

type BaselineMutation = Mutation<BaselineState>

export interface BaselineMutations {
    PJNZUploaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    PJNZLoaded: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZUploaded(state: BaselineState, action: PayloadWithType<PjnzResponse>) {
        state.pjnzError = "";
        state.pjnzFilename = action.payload.filename;
        state.country = action.payload.data.country;
    },

    PJNZUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.pjnzError = action.payload;
    },

    PJNZLoaded(state: BaselineState, action: PayloadWithType<PjnzResponse | null>) {
        const data = action.payload;
        if (data){
            state.country = data.data.country;
            state.pjnzFilename = data.filename;
         }
    }
};
