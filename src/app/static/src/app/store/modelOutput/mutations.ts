import {MutationTree} from "vuex";
import {ModelOutputState} from "./modelOutput";
import {PayloadWithType} from "../../types";

export enum ModelOutputMutation {
    TabSelected = "TabSelected",
    Update = "Update"
}

export const mutations: MutationTree<ModelOutputState> = {

    [ModelOutputMutation.TabSelected](state: ModelOutputState, tab: string) {
        state.selectedTab = tab;
    },

    [ModelOutputMutation.Update](state: ModelOutputState, payload: any) {
        const {selectedTab, selections} = state
        // As the barchart does not update on render, any updates from the bar tab are true updates
        if (selectedTab === 'bar'){
            state.changes = true;
        } else {
            // As the bubble and map update on render, this stores their initial updates in state
            // and then references new updates against those initially logged inorder to detect
            // changes made by the user
            const originKey = Object.keys(payload)[0]
            const originTab = originKey + '_' + selectedTab
            if (originTab && !(originTab in selections)){
                if (typeof(payload[originKey]) === 'string' || typeof(payload[originKey]) === 'number'){
                    selections[originTab] = payload[originKey]
                } else selections[originTab] = {...payload[originKey]}
            } else if (JSON.stringify(selections[originTab]) !== JSON.stringify(payload[originKey])){
                state.changes = true;
            }
        }
    }
};