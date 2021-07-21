import {MutationTree} from 'vuex';
import {MetadataState} from "./metadata";
import {PlottingMetadataResponse, Error, AdrMetadataResponse} from "../../generated";
import {PayloadWithType} from "../../types";

export enum MetadataMutations {
    PlottingMetadataFetched= "PlottingMetadataFetched",
    PlottingMetadataError = "PlottingMetadataError",
    AdrUploadMetadataFetched = "AdrUploadMetadataFetched",
    AdrUploadMetadataError = "AdrUploadMetadataError"
}

export const mutations: MutationTree<MetadataState> = {

    [MetadataMutations.PlottingMetadataError](state: MetadataState, action: PayloadWithType<Error>) {
        state.plottingMetadataError = action.payload;
    },

    [MetadataMutations.PlottingMetadataFetched](state: MetadataState, action: PayloadWithType<PlottingMetadataResponse>) {
        state.plottingMetadata = action.payload;
        state.plottingMetadataError = null;
    },

    [MetadataMutations.AdrUploadMetadataError](state: MetadataState, action: PayloadWithType<Error>) {
        state.adrUploadMetadataError = action.payload;
    },

    [MetadataMutations.AdrUploadMetadataFetched](state: MetadataState, action: PayloadWithType<AdrMetadataResponse>) {
        const adrMetadataTypeExists = state.adrUploadMetadata
            .findIndex(adrMeta => adrMeta.type === action.payload.type)

        adrMetadataTypeExists > -1 ?
            state.adrUploadMetadata[adrMetadataTypeExists].description = action.payload.description
            : state.adrUploadMetadata.push({type: action.payload.type, description: action.payload.description})

        state.adrUploadMetadataError = null;
    }
};
