import {MutationTree} from 'vuex';
import {GenericChartState} from "./genericChart";
import {GenericChartMetadataResponse, PayloadWithType} from "../../types";

export enum GenericChartMutation {
    GenericChartMetadataFetched = "GenericChartMetadataFetched",
}

export const mutations: MutationTree<GenericChartState> = {
    [GenericChartMutation.GenericChartMetadataFetched](state: GenericChartState, action: PayloadWithType<GenericChartMetadataResponse>) {
        state.genericChartMetadata = action.payload;
    }
};
