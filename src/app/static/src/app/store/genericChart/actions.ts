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
        await api<GenericChartMutation, "">(context)
            .ignoreSuccess()
            .ignoreErrors()
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
            })
            .catch((e) => {
                // TODO: !! Commit error to state
                console.log("Fetch dataset failed: " + JSON.stringify(e))
            });
    }
};
