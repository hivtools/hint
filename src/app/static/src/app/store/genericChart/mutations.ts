import {Mutation, MutationTree} from 'vuex';
import {GenericChartState} from "./genericChart";
import {GenericChartMetadataResponse, PayloadWithType} from "../../types";

type GenericChartMutation = Mutation<GenericChartState>

export interface GenericChartMutations {
    GenericChartMetadataFetched: GenericChartMutation
}

export const mutations: MutationTree<GenericChartState> & GenericChartMutations = {
    GenericChartMetadataFetched(state: GenericChartState, action: PayloadWithType<GenericChartMetadataResponse>) {
        state.genericChartMetadata = action.payload;
    }
};
