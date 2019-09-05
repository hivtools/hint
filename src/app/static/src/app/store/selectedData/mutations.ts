import {PayloadWithType} from "../../types";
import {Mutation, MutationTree} from "vuex";
import {DataType, SelectedDataState} from "./selectedData";

type SelectedDataMutation = Mutation<SelectedDataState>

export interface SelectedDataMutations {
    SelectedDataUpdated: SelectedDataMutation
}

export const mutations: MutationTree<SelectedDataState> & SelectedDataMutations  = {
    SelectedDataUpdated(state: SelectedDataState, action: PayloadWithType<DataType>) {
        state.selectedDataType = action.payload
    }
};