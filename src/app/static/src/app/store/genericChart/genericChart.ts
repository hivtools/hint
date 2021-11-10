import {Dict, GenericChartDataset, GenericChartMetadataResponse} from "../../types";
import {Module} from "vuex";
import {RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface GenericChartState {
    genericChartMetadata: GenericChartMetadataResponse | null
    datasets: Record<string, GenericChartDataset>
    genericChartError: Error | null
}

export const initialGenericChartState = (): GenericChartState => {
    return {
        genericChartMetadata: null,
        datasets: {},
        genericChartError: null
    }
};

const namespaced = true;

export const genericChart: Module<GenericChartState, RootState> = {
    namespaced,
    state: {...initialGenericChartState()},
    actions,
    mutations,
};
