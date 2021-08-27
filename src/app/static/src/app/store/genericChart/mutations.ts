import {MutationTree} from 'vuex';
import {GenericChartState} from "./genericChart";
import {Dict, GenericChartDataset, GenericChartMetadataResponse, PayloadWithType} from "../../types";

export enum GenericChartMutation {
    GenericChartMetadataFetched = "GenericChartMetadataFetched",
    SetDataset = "SetDataset",
    SetError = "SetError"
}

export interface SetDatasetPayload {
    datasetId: string,
    dataset: GenericChartDataset
}

export const mutations: MutationTree<GenericChartState> = {
    [GenericChartMutation.GenericChartMetadataFetched](state: GenericChartState, action: PayloadWithType<GenericChartMetadataResponse>) {
        state.genericChartMetadata = action.payload;
    },
    [GenericChartMutation.SetDataset](state: GenericChartState, action: PayloadWithType<SetDatasetPayload>) {
        const newDatasets = {...state.datasets, [action.payload.datasetId]: action.payload.dataset}
        state.datasets = newDatasets;
    },
    [GenericChartMutation.SetError](state: GenericChartState, action: PayloadWithType<Error | null>) {
        state.genericChartError = action.payload;
    }
};
