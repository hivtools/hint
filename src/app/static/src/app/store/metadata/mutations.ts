import {Mutation, MutationTree} from 'vuex';
import {MetadataState} from "./metadata";
import {PlottingMetadataResponse} from "../../generated";
import {PayloadWithType} from "../../types";

type MetadataMutation = Mutation<MetadataState>

export interface MetadataMutations {
    PlottingMetadataFetched: MetadataMutation
    PlottingMetadataError: MetadataMutation
}

export const mutations: MutationTree<MetadataState> & MetadataMutations = {

    PlottingMetadataError(state: MetadataState, action: PayloadWithType<string>) {
        state.plottingMetadataError = action.payload;
    },

    PlottingMetadataFetched(state: MetadataState, action: PayloadWithType<PlottingMetadataResponse>) {
        state.plottingMetadata = action.payload;
        state.plottingMetadataError = "";
    }
};
