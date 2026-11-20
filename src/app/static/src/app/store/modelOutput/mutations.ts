import type {MutationTree} from "vuex";
import type {ModelOutputState} from "./modelOutput";
import type {PayloadWithType} from "../../types";
import type {OutputPlotName} from "../plotSelections/plotSelections";

export enum ModelOutputMutation {
    TabSelected = "TabSelected"
}

export const mutations: MutationTree<ModelOutputState> = {

    [ModelOutputMutation.TabSelected](state: ModelOutputState, payload: PayloadWithType<OutputPlotName>) {
        state.selectedTab = payload.payload;
    },
};
