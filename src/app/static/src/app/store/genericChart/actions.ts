import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {GenericChartState} from "./genericChart";
import {GenericChartMutation} from "./mutations";

export interface MetadataActions {
    getGenericChartMetadata: (store: ActionContext<GenericChartState, RootState>) => void
    getDataset: (store: ActionContext<GenericChartState, RootState>, payload: getDatasetPayload) => void
}

export interface getDatasetPayload {
    datasetId: string,
    url: string
}

export const actions: ActionTree<GenericChartState, RootState> & MetadataActions = {
    async getGenericChartMetadata(context) {
        await api<GenericChartMutation, "">(context)
            .withSuccess(GenericChartMutation.GenericChartMetadataFetched)
            .ignoreErrors()
            .get(`/meta/generic-chart`);
    },
    async getDataset(context, payload) {
        const {commit} = context;
        commit({type: GenericChartMutation.SetError, payload: null});
        await api<GenericChartMutation, GenericChartMutation>(context)
            .ignoreSuccess()
            .withError(GenericChartMutation.SetError)
            .freezeResponse()
            .get(payload.url)
            .then((response) => {
                if (response) {
                    commit({
                        type: GenericChartMutation.SetDataset,
                        payload: {
                            datasetId: payload.datasetId,
                            dataset: response.data as unknown
                        }
                    });
                }
            });
    }
};
