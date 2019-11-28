import {MutationTree} from "vuex";
import {ModelOutputState} from "./modelOutput";
import {PayloadWithType} from "../../types";

export enum ModelOutputMutation {
    TabSelected = "TabSelected"
}

export const mutations: MutationTree<ModelOutputState> = {

    [ModelOutputMutation.TabSelected](state: ModelOutputState, tab: string) {
        state.selectedTab = tab;
    }
};