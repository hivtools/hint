import {MutationTree} from 'vuex';
import {ReviewInputState} from "./reviewInput";
import {ReviewInputDataset, PayloadWithType} from "../../types";
import {Error, Warning} from "../../generated";

export enum ReviewInputMutation {
    SetDataset = "SetDataset",
    ClearDataset = "ClearDataset",
    SetError = "SetError",
    ClearWarnings = "ClearWarnings",
    WarningsFetched = "WarningsFetched",
    SetLoading = "SetLoading"
}

export interface SetDatasetPayload {
    datasetId: string,
    dataset: ReviewInputDataset
}

export const mutations: MutationTree<ReviewInputState> = {
    [ReviewInputMutation.SetDataset](state: ReviewInputState, action: PayloadWithType<SetDatasetPayload>) {
        state.datasets[action.payload.datasetId] = action.payload.dataset;
    },
    [ReviewInputMutation.ClearDataset](state: ReviewInputState, action: PayloadWithType<string>) {
        delete state.datasets[action.payload]
    },
    [ReviewInputMutation.SetError](state: ReviewInputState, action: PayloadWithType<Error | null>) {
        state.error = action.payload;
    },
    [ReviewInputMutation.WarningsFetched](state: ReviewInputState, action: PayloadWithType<Warning[]>) {
        state.warnings = action.payload
    },
    [ReviewInputMutation.ClearWarnings](state: ReviewInputState) {
        state.warnings = []
    },
    [ReviewInputMutation.SetLoading](state: ReviewInputState, action: PayloadWithType<boolean>) {
        state.loading = action.payload;
    }
};
