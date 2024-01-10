import {MutationTree} from "vuex";
import {ModelOutputState} from "./modelOutput";
import {ModelOutputTabs, PayloadWithType} from "../../types";

export enum ModelOutputMutation {
    TabSelected = "TabSelected",
    SetTabLoading = "SetTabLoading",
    SetFetchDataNumber = "SetFetchDataNumber"
}

type TabLoading = {
    tab: ModelOutputTabs,
    loading: boolean
}

export const mutations: MutationTree<ModelOutputState> = {

    [ModelOutputMutation.TabSelected](state: ModelOutputState, payload: PayloadWithType<ModelOutputTabs>) {
        state.selectedTab = payload.payload;
    },

    [ModelOutputMutation.SetTabLoading](state: ModelOutputState, payload: PayloadWithType<TabLoading>) {
        state.loading[payload.payload.tab] = payload.payload.loading;
    },

    [ModelOutputMutation.SetFetchDataNumber](state: ModelOutputState, payload: PayloadWithType<number>) {
        state.fetchDataNumber = payload.payload;
    },
};
