import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {GenericChartState} from "./genericChart";

export type GenericChartMutation = "GenericChartMetadataFetched"

export interface MetadataActions {
    getGenericChartMetadata: (store: ActionContext<GenericChartState, RootState>, country: string) => void
}

export const actions: ActionTree<GenericChartState, RootState> & MetadataActions = {
    async getGenericChartMetadata(context) {
        await api<GenericChartMutation, GenericChartMutation>(context)
            .withSuccess("GenericChartMetadataFetched")
            .ignoreErrors()
            .get(`/meta/generic-chart`);
    }
};
