import {MutationTree} from "vuex";
import {ModelOutputState} from "./modelOutput";
import {ModelOutputTabs, PayloadWithType} from "../../types";

export enum ModelOutputMutation {
    TabSelected = "TabSelected",
    AddIndicatorBeingFetched = "AddIndicatorBeingFetched",
    RemoveIndicatorBeingFetched = "RemoveIndicatorBeingFetched",
}

export const mutations: MutationTree<ModelOutputState> = {

    [ModelOutputMutation.TabSelected](state: ModelOutputState, payload: PayloadWithType<ModelOutputTabs>) {
        state.selectedTab = payload.payload;
    },

    [ModelOutputMutation.AddIndicatorBeingFetched](state: ModelOutputState, payload: PayloadWithType<string>) {
        if (!state.indicatorsBeingFetched.includes(payload.payload)) {
            state.indicatorsBeingFetched.push(payload.payload);
        }
    },

    [ModelOutputMutation.RemoveIndicatorBeingFetched](state: ModelOutputState, payload: PayloadWithType<string>) {
        if (state.indicatorsBeingFetched.includes(payload.payload)) {
            state.indicatorsBeingFetched = state.indicatorsBeingFetched.filter(indicator => indicator !== payload.payload);
        }
    },
};
