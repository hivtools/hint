import {ActionContext, ActionTree} from 'vuex';
import {api} from "../../apiService";
import {MetadataState} from "./metadata";
import {MetadataMutations} from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface MetadataActions {
    getPlottingMetadata: (store: ActionContext<MetadataState, DataExplorationState>, country: string) => void
    getAdrUploadMetadata: (store: ActionContext<MetadataState, DataExplorationState>, downloadId: string) => Promise<void>
}

export const actions: ActionTree<MetadataState, DataExplorationState> & MetadataActions = {

    async getPlottingMetadata(context, iso3) {
        await api<MetadataMutations, MetadataMutations>(context)
            .withSuccess(MetadataMutations.PlottingMetadataFetched)
            .withError(MetadataMutations.PlottingMetadataError)
            .get(`/meta/plotting/${iso3}`);
    },

    async getAdrUploadMetadata(context, downloadId) {
        await api<MetadataMutations, MetadataMutations>(context)
            .withSuccess(MetadataMutations.AdrUploadMetadataFetched)
            .withError(MetadataMutations.AdrUploadMetadataError)
            .get(`/meta/adr/${downloadId}`)
    }
};
