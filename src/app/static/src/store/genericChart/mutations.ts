import {defineComponent} from "vue";
import {MutationTree} from 'vuex';
import {GenericChartState} from "./genericChart";
import {GenericChartDataset, GenericChartMetadataResponse, PayloadWithType} from "../../types";
import {Warning} from "../../generated";

export enum GenericChartMutation {
    GenericChartMetadataFetched = "GenericChartMetadataFetched",
    SetDataset = "SetDataset",
    ClearDataset = "ClearDataset",
    SetError = "SetError",
    ClearWarnings = "ClearWarnings",
    WarningsFetched = "WarningsFetched"
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
        Vue.set(state.datasets, action.payload.datasetId, action.payload.dataset);
        state.selectionDatasetId = action.payload.datasetId;
    },
    [GenericChartMutation.ClearDataset](state: GenericChartState, action: PayloadWithType<string>) {
        delete state.datasets[action.payload]
    },
    [GenericChartMutation.SetError](state: GenericChartState, action: PayloadWithType<Error | null>) {
        state.genericChartError = action.payload;
    },
    [GenericChartMutation.WarningsFetched](state: GenericChartState, action: PayloadWithType<Warning[]>) {
        state.warnings = action.payload
    },
    [GenericChartMutation.ClearWarnings](state: GenericChartState) {
        state.warnings = []
    }
};
