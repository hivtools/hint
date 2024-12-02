import {MutationTree} from 'vuex';
import {ReviewInputState} from "./reviewInput";
import {ReviewInputDataset, PayloadWithType} from "../../types";
import {
    Error,
    InputComparisonResponse,
    InputPopulationMetadataResponse,
    Warning
} from "../../generated";
import {PopulationChartDataset} from "../plotSelections/plotSelections";

export enum ReviewInputMutation {
    SetDataset = "SetDataset",
    ClearDataset = "ClearDataset",
    ClearInputComparison = "ClearInputComparison",
    SetError = "SetError",
    ClearWarnings = "ClearWarnings",
    WarningsFetched = "WarningsFetched",
    SetLoading = "SetLoading",
    SetInputComparisonLoading = "SetInputComparisonLoading",
    SetInputComparisonError = "SetInputComparisonError",
    SetInputComparisonData = "SetInputComparisonData",
    SetPopulationLoading = "SetPopulationLoading",
    SetPopulationError = "SetPopulationError",
    SetPopulationMetadata = "SetPopulationMetadata",
    SetPopulationCountryLevel = "SetPopulationCountryLevel",
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
    [ReviewInputMutation.ClearInputComparison](state: ReviewInputState) {
        state.inputComparison = {
            loading: false,
            error: null,
            data: null
        };
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
    },
    [ReviewInputMutation.SetInputComparisonLoading](state: ReviewInputState, action: PayloadWithType<boolean>) {
        state.inputComparison.loading = action.payload;
    },
    [ReviewInputMutation.SetInputComparisonError](state: ReviewInputState, action: PayloadWithType<Error | null>) {
        state.inputComparison.error = action.payload;
    },
    [ReviewInputMutation.SetInputComparisonData](state: ReviewInputState, action: PayloadWithType<InputComparisonResponse>) {
        state.inputComparison.data = action.payload;
    },
    [ReviewInputMutation.SetPopulationLoading](state: ReviewInputState, action: PayloadWithType<boolean>) {
        state.population.loading = action.payload;
    },
    [ReviewInputMutation.SetPopulationError](state: ReviewInputState, action: PayloadWithType<Error | null>) {
        state.population.error = action.payload;
    },
    [ReviewInputMutation.SetPopulationMetadata](state: ReviewInputState, action: PayloadWithType<InputPopulationMetadataResponse>) {
        state.population.data = action.payload;
    },
    [ReviewInputMutation.SetPopulationCountryLevel](state: ReviewInputState, action: PayloadWithType<PopulationChartDataset[]>) {
        state.population.countryLevelData = action.payload;
    },
};
