import {Mutation, MutationTree} from 'vuex';
import {BaselineDataLoaded, BaselinePayload, PJNZLoaded, PJNZUploadError} from "./actions";
import {BaselineState} from "./baseline";

interface BaselineMutation extends Mutation<BaselineState> {
    payload?: BaselinePayload
}

export interface BaselineMutations {
    PJNZLoaded: BaselineMutation
    PJNZUploadError: BaselineMutation
    BaselineDataLoaded: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {
    PJNZLoaded(state: BaselineState, action: PJNZLoaded) {
        state.pjnzError = "";
        state.country = action.payload.country
    },

    PJNZUploadError(state: BaselineState, action: PJNZUploadError) {
        state.pjnzError = action.payload;
    },

    BaselineDataLoaded(state: BaselineState, action: BaselineDataLoaded) {
        const data = action.payload;
        console.log(data);
        if (data.pjnz){
            state.country = data.pjnz.country;
            state.pjnzFileName = data.pjnz.filename;
         }
    }
};

