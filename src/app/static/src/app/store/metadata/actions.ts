import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {MetadataState} from "./metadata";

export type MetadataActionTypes = "PlottingMetadataFetched" | "GenericChartMetadataFetched"
export type MetadataErrorActionTypes = "PlottingMetadataError"

export interface MetadataActions {
    getPlottingMetadata: (store: ActionContext<MetadataState, RootState>, country: string) => void
}

export const actions: ActionTree<MetadataState, RootState> & MetadataActions = {

    async getPlottingMetadata(context, iso3) {
        await api<MetadataActionTypes, MetadataErrorActionTypes>(context)
            .withSuccess("PlottingMetadataFetched")
            .withError("PlottingMetadataError")
            .get(`/meta/plotting/${iso3}`);
    }
};
