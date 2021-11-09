import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {GenericChartState} from "./genericChart";
import {GenericChartMutation} from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface MetadataActions {
    getGenericChartMetadata: (store: ActionContext<GenericChartState, DataExplorationState>) => void
}

export const actions: ActionTree<GenericChartState, DataExplorationState> & MetadataActions = {
    async getGenericChartMetadata(context) {
        await api<GenericChartMutation, "">(context)
            .withSuccess(GenericChartMutation.GenericChartMetadataFetched)
            .ignoreErrors()
            .get(`/meta/generic-chart`);
    }
};
