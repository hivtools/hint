import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {PjnzResponse, PopulationResponse, ShapeResponse} from "../../generated";
import {PayloadWithType} from "../../types";
import {readyStateMutations} from "../shared/readyStateMutations";
import {ReadyState} from "../../root";

type BaselineMutation = Mutation<BaselineState>

export interface BaselineMutations {
    PJNZUpdated: BaselineMutation
    PJNZUploadError: BaselineMutation
    ShapeUpdated: BaselineMutation
    ShapeUploadError: BaselineMutation
    PopulationUpdated: BaselineMutation
    PopulationUploadError: BaselineMutation
    Ready: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {

    PJNZUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.pjnzError = action.payload;
    },

    PJNZUpdated(state: BaselineState, action: PayloadWithType<PjnzResponse | null>) {
        const data = action.payload;
        if (data) {
            state.country = data.data.country;
            state.pjnzFilename = data.filename;
        }
        state.pjnzError = "";
    },

    ShapeUpdated(state: BaselineState, action: PayloadWithType<ShapeResponse>) {
        state.shape = action.payload;
        state.shapeError = "";
    },

    ShapeUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.shapeError = action.payload;
    },

    PopulationUpdated(state: BaselineState, action: PayloadWithType<PopulationResponse>) {
        state.population = action.payload;
        state.populationError = "";
    },

    PopulationUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.populationError = action.payload;
    },

    ...readyStateMutations
};
