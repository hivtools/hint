import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {PjnzResponse} from "../../generated";
import {BaselineData, PayloadWithType} from "../../types";

type BaselineMutation = Mutation<BaselineState>

export interface BaselineMutations {
    PJNZUploaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    BaselineDataLoaded: BaselineMutation
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

    BaselineDataLoaded(state: BaselineState, action: PayloadWithType<BaselineData>) {
        const data = action.payload;
        if (data.pjnz){
            state.country = data.pjnz.data.country;
            state.pjnzFilename = data.pjnz.filename;
         }
    }
};
