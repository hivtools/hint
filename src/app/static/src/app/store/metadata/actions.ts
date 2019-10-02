import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {MetadataState} from "./metadata";

export type MetadataActionTypes = "PlottingMetadataFetched"
export type MetadataErrorActionTypes = "PlottingMetadataError"

export interface MetadataActions {
    getPlottingMetadata: (store: ActionContext<MetadataState, RootState>, country: string) => void
}

export const actions: ActionTree<MetadataState, RootState> & MetadataActions = {

    async getPlottingMetadata({commit}, country) {
        await api<MetadataActionTypes, MetadataErrorActionTypes>(commit)
            .withSuccess("PlottingMetadataFetched")
            .withError("PlottingMetadataError")
            .get(`/meta/plotting/${country}`);
    }
};
