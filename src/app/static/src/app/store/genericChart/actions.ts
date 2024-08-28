import {ActionContext, ActionTree} from 'vuex';
import {api} from "../../apiService";
import {GenericChartState} from "./genericChart";
import {GenericChartMutation} from "./mutations";
import {DatasetConfig, Dict, GenericChartDataset, GenericChartMetadata} from "../../types";
import {RootState} from "../../root";

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
            .freezeResponse()
            .get(`/meta/generic-chart`);
    },
    async getDataset(context, payload) {
        const {commit} = context;
        commit({type: GenericChartMutation.SetError, payload: null});
        console.log("getting dataset)", payload.url)
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
                            dataset: response.data
                        }
                    });

                    const data = response.data as GenericChartDataset
                    commit({type: GenericChartMutation.WarningsFetched, payload: data.warnings});
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

        console.log(Object.keys(state.datasets))
        console.log(datasetUrls)

        const getDatasetActions: Promise<unknown>[] = [];
        Object.keys(state.datasets).forEach((datasetId: string) => {
            const url = datasetUrls[datasetId];
            console.log("refreshing dataset")
            getDatasetActions.push(dispatch("getDataset", {datasetId, url}));
        });
        await Promise.all(getDatasetActions);
    }
};
