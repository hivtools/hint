import {GenericChartDataset, GenericChartMetadataResponse} from "../../types";
import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {WarningsState} from "../../root";

export interface GenericChartState extends WarningsState{
    genericChartMetadata: GenericChartMetadataResponse | null
    datasets: Record<string, GenericChartDataset>
    selectionDatasetId: string
    genericChartError: Error | null
}

export const initialGenericChartState = (): GenericChartState => {
    return {
        genericChartMetadata: null,
        datasets: {},
        genericChartError: null,
        selectionDatasetId: "",
        warnings: []
    }
};

const namespaced = true;

export const genericChart: Module<GenericChartState, DataExplorationState> = {
    namespaced,
    state: {...initialGenericChartState()},
    actions,
    mutations,
};
