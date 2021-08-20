import {Dict, GenericChartMetadataResponse} from "../../types";
import {Module} from "vuex";
import {RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface GenericChartState {
    genericChartMetadata: GenericChartMetadataResponse | null
    datasets: Record<string, Dict<unknown>[]>
}

export const initialGenericChartState = (): GenericChartState => {
    return {
        genericChartMetadata: null,
        datasets: {}
    }
};

const namespaced = true;

export const genericChart: Module<GenericChartState, RootState> = {
    namespaced,
    state: {...initialGenericChartState()},
    actions,
    mutations,
};
