import {MutationTree} from "vuex";
import {ModelOutputState} from "./modelOutput";
import {ModelOutputTabs, PayloadWithType} from "../../types";

export enum ModelOutputMutation {
    TabSelected = "TabSelected"
}

export const mutations: MutationTree<ModelOutputState> = {

    [ModelOutputMutation.TabSelected](state: ModelOutputState, payload: PayloadWithType<ModelOutputTabs>) {
        state.selectedTab = payload.payload;
    }
};
