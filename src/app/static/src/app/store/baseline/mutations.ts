import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {PjnzResponse, ShapeResponse} from "../../generated";
import {PayloadWithType} from "../../types";

type BaselineMutation = Mutation<BaselineState>

export interface BaselineMutations {
    PJNZUploaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    PJNZLoaded: BaselineMutation,
    ShapeUploaded: BaselineMutation
    ShapeUploadError: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZUploaded(state: BaselineState, action: PayloadWithType<PjnzResponse>) {
        state.pjnzError = "";
        state.pjnzFilename = action.payload.filename;
        state.country = action.payload.data.country;
        // TODO this step isn't really complete until all files are uploaded
        // but for now lets say it is
        state.complete = true;
    },

    PJNZUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.pjnzError = action.payload;
    },

    PJNZLoaded(state: BaselineState, action: PayloadWithType<PjnzResponse | null>) {
        const data = action.payload;
        if (data){
            state.country = data.data.country;
            state.pjnzFilename = data.filename;
            // TODO this step isn't really complete until all files are uploaded
            // but for now lets say it is
            state.complete = true;
         }
    },

    ShapeUploaded(state: BaselineState, action: PayloadWithType<ShapeResponse>) {
        state.shape = action.payload
    },

    ShapeUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.shapeError = action.payload;
    }
};
