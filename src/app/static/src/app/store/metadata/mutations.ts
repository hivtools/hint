import {MutationTree} from 'vuex';
import {MetadataState} from "./metadata";
import {Error, AdrMetadataResponse, ReviewInputFilterMetadataResponse} from "../../generated";
import {PayloadWithType} from "../../types";

export enum MetadataMutations {
    ReviewInputsMetadataFetched = "ReviewInputsMetadataFetched",
    ReviewInputsMetadataError = "ReviewInputsMetadataError",
    ReviewInputsMetadataToggleComplete = "ReviewInputsMetadataToggleComplete",
    AdrUploadMetadataFetched = "AdrUploadMetadataFetched",
    AdrUploadMetadataError = "AdrUploadMetadataError"
}

export const mutations: MutationTree<MetadataState> = {
    [MetadataMutations.ReviewInputsMetadataFetched](state: MetadataState, action: PayloadWithType<ReviewInputFilterMetadataResponse>) {
        state.reviewInputMetadata = action.payload;
        state.reviewInputMetadataError = null;
    },

    [MetadataMutations.ReviewInputsMetadataError](state: MetadataState, action: PayloadWithType<Error>) {
        state.reviewInputMetadataError = action.payload;
    },

    [MetadataMutations.ReviewInputsMetadataToggleComplete](state: MetadataState, action: PayloadWithType<boolean>) {
        state.reviewInputMetadataFetched = action.payload;
    },

    [MetadataMutations.AdrUploadMetadataError](state: MetadataState, action: PayloadWithType<Error>) {
        state.adrUploadMetadataError = action.payload;
    },

    [MetadataMutations.AdrUploadMetadataFetched](state: MetadataState, action: PayloadWithType<AdrMetadataResponse>) {
        const adrMeta = state.adrUploadMetadata.find(adrMeta => adrMeta.type === action.payload.type);
        if (adrMeta) {
            adrMeta.description = action.payload.description;
        } else {
            state.adrUploadMetadata.push({type: action.payload.type, description: action.payload.description});
        }

        state.adrUploadMetadataError = null;
    }
};
