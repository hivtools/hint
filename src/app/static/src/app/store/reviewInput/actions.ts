import {ActionContext, ActionTree} from 'vuex';
import {api} from "../../apiService";
import {ReviewInputState} from "./reviewInput";
import {ReviewInputMutation} from "./mutations";
import {ReviewInputDataset} from "../../types";
import {RootState} from "../../root";
import {commitPlotDefaultSelections, filtersAfterUseShapeRegions} from "../plotSelections/utils";
import {InputComparisonResponse, InputPopulationMetadataResponse} from "../../generated";

export interface ReviewInputActions {
    getDataset: (store: ActionContext<ReviewInputState, RootState>, payload: getDatasetPayload) => void
    refreshDatasets: (store: ActionContext<ReviewInputState, RootState>) => void
    getInputComparisonDataset: (store: ActionContext<ReviewInputState, RootState>) => void
    getPopulationDataset: (store: ActionContext<ReviewInputState, RootState>) => void
}

export interface getDatasetPayload {
    datasetId: string,
    url: string
}

export const actions: ActionTree<ReviewInputState, RootState> & ReviewInputActions = {
    async getDataset(context, payload) {
        const {commit} = context;
        commit({type: ReviewInputMutation.SetError, payload: null});
        await api<ReviewInputMutation, ReviewInputMutation>(context)
            .ignoreSuccess()
            .withError(ReviewInputMutation.SetError)
            .freezeResponse()
            .get(payload.url)
            .then((response) => {
                if (response) {
                    commit({
                        type: ReviewInputMutation.SetDataset,
                        payload: {
                            datasetId: payload.datasetId,
                            dataset: response.data
                        }
                    });

                    const data = response.data as ReviewInputDataset
                    commit({type: ReviewInputMutation.WarningsFetched, payload: data.warnings});
                }
            });
    },

    async refreshDatasets(context){
        const {dispatch} = context;

        const getDatasetActions: Promise<unknown>[] = [];
        getDatasetActions.push(dispatch("getDataset", {datasetId: "programme", url: "/chart-data/input-time-series/programme"}));
        getDatasetActions.push(dispatch("getDataset", {datasetId: "anc", url: "/chart-data/input-time-series/anc"}));

        await Promise.all(getDatasetActions);
    },

    async getInputComparisonDataset(context) {
        const {commit, rootState, rootGetters} = context;
        commit({type: ReviewInputMutation.SetInputComparisonLoading, payload: true})
        commit({type: ReviewInputMutation.SetInputComparisonError, payload: null});
        await api<ReviewInputMutation, ReviewInputMutation>(context)
            .withSuccess(ReviewInputMutation.SetInputComparisonData)
            .withError(ReviewInputMutation.SetInputComparisonError)
            .freezeResponse()
            .get<InputComparisonResponse>("/chart-data/input-comparison")
            .then(async (response) => {
                    if (response) {
                        const metadata = response.data.metadata;
                        await commitPlotDefaultSelections(metadata, commit, rootState, rootGetters);
                    }
                    commit({type: ReviewInputMutation.SetInputComparisonLoading, payload: false});
                }
            )
    },

    async getPopulationDataset(context) {
        const {commit, rootState, rootGetters} = context;
        commit({type: ReviewInputMutation.SetPopulationLoading, payload: true})
        commit({type: ReviewInputMutation.SetPopulationError, payload: null});
        await api<ReviewInputMutation, ReviewInputMutation>(context)
            .withSuccess(ReviewInputMutation.SetPopulationMetadata)
            .withError(ReviewInputMutation.SetPopulationError)
            .get<InputPopulationMetadataResponse>("/chart-data/input-population")
            .then(async (response) => {
                if (response) {
                    const metadata = response.data;
                    metadata.filterTypes = filtersAfterUseShapeRegions(metadata.filterTypes, rootState);
                    await commitPlotDefaultSelections(metadata, commit, rootState, rootGetters);
                }
                commit({type: ReviewInputMutation.SetPopulationLoading, payload: false});
            })
    }
};
