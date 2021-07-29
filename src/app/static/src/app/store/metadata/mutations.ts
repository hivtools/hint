import {Mutation, MutationTree} from 'vuex';
import {MetadataState} from "./metadata";
import {PlottingMetadataResponse, Error} from "../../generated";
import {GenericChartMetadataResponse, PayloadWithType} from "../../types";

type MetadataMutation = Mutation<MetadataState>

export interface MetadataMutations {
    PlottingMetadataFetched: MetadataMutation
    PlottingMetadataError: MetadataMutation
}

export const mutations: MutationTree<MetadataState> & MetadataMutations = {

    PlottingMetadataError(state: MetadataState, action: PayloadWithType<Error>) {
        state.plottingMetadataError = action.payload;
    },

    PlottingMetadataFetched(state: MetadataState, action: PayloadWithType<PlottingMetadataResponse>) {
        state.plottingMetadata = action.payload;
        state.plottingMetadataError = null;
    }
};
