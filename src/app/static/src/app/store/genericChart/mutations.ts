import {MutationTree} from 'vuex';
import {GenericChartState} from "./genericChart";
import {Dict, GenericChartMetadataResponse, PayloadWithType} from "../../types";

export enum GenericChartMutation {
    GenericChartMetadataFetched = "GenericChartMetadataFetched",
    SetDataset = "SetDataset"
}

export interface SetDatasetPayload {
    datasetId: string,
    dataset: Dict<unknown>[]
}

export const mutations: MutationTree<GenericChartState> = {
    [GenericChartMutation.GenericChartMetadataFetched](state: GenericChartState, action: PayloadWithType<GenericChartMetadataResponse>) {
        state.genericChartMetadata = action.payload;
    },
    [GenericChartMutation.SetDataset](state: GenericChartState, action: PayloadWithType<SetDatasetPayload>) {
        state.datasets[action.payload.datasetId] = action.payload.dataset;
    }
};
