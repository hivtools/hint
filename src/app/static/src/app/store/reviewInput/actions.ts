import {ActionContext, ActionTree} from 'vuex';
import {api} from "../../apiService";
import {ReviewInputState} from "./reviewInput";
import {ReviewInputMutation} from "./mutations";
import {ReviewInputDataset} from "../../types";
import {RootState} from "../../root";
import {commitPlotDefaultSelections, filtersAfterUseShapeRegions} from "../plotSelections/utils";
import {InputComparisonResponse} from "../../generated";
import { BaselineMutation } from '../baseline/mutations';

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
        const {commit, rootState} = context;
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
                        await commitPlotDefaultSelections(metadata, commit, rootState);
                    }
                    commit({type: ReviewInputMutation.SetInputComparisonLoading, payload: false});
                }
            )
    },

    async getPopulationDataset(context) {
        const {commit, rootState} = context;
        const populationMetadata = rootState.baseline.population!.metadata
        const populationMetadataClone = {...populationMetadata}
        const populationData = rootState.baseline.population
        const populationDataClone = { ...populationData}
        populationMetadataClone.filterTypes = filtersAfterUseShapeRegions(populationMetadataClone.filterTypes, rootState);
        populationDataClone.metadata = populationMetadataClone
        commit(`baseline/${BaselineMutation.PopulationUpdated}`, {payload: populationDataClone}, {root:true});
        await commitPlotDefaultSelections(populationMetadataClone, commit, rootState);
    }
};
