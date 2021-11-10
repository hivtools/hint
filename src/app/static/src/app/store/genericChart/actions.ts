import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {api} from "../../apiService";
import {GenericChartState} from "./genericChart";
import {GenericChartMutation} from "./mutations";
import {DatasetConfig, Dict, GenericChartMetadata} from "../../types";

export interface MetadataActions {
    getGenericChartMetadata: (store: ActionContext<GenericChartState, RootState>) => void
    getDataset: (store: ActionContext<GenericChartState, RootState>, payload: getDatasetPayload) => void
    refreshDatasets: (store: ActionContext<GenericChartState, RootState>) => void
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
    },
    async refreshDatasets(context){
        const {dispatch, state} = context;
        if (!state.genericChartMetadata) {
            return;
        }

        const datasetUrls = Object.values(state.genericChartMetadata)
                            .reduce((urls: Dict<string>, chart: GenericChartMetadata) => {
                                chart.datasets.forEach((dataset: DatasetConfig) => {
                                    urls[dataset.id] = dataset.url
                                });
                                return urls;
                            }, {});

        const getDatasetActions: Promise<unknown>[] = [];
        Object.keys(state.datasets).forEach((datasetId: string) => {
            const url = datasetUrls[datasetId];
            getDatasetActions.push(dispatch("getDataset", {datasetId, url}));
        });
        await Promise.all(getDatasetActions);
    }
};
