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
        // console.log('key update', Object.keys(payload.payload))
        const {selectedTab, selections} = state
        if (selectedTab === 'bar'){
            state.changes = true;
            // console.log('bar updated =', state.changes)
        } else {
            const originKey = Object.keys(payload)[0]
            // if (originKey){
                const originTab = originKey + '_' + selectedTab
                // if (payload && payload.payload && Object.keys(payload.payload.length === 1)){
                if (originTab && !(originTab in selections)){
                    // console.log('key update', Object.keys(payload), originTab)
                    // state.selections = {...state.selections, origin: {...payload[Object.keys(payload)[0]]}}
                    if (typeof(payload[originKey]) === 'string' || typeof(payload[originKey]) === 'number'){
                        selections[originTab] = payload[originKey]
                    } else selections[originTab] = {...payload[originKey]}
                    // if (payload[originKey].isObject() || payload[originKey].isArray())
                } else if (JSON.stringify(selections[originTab]) !== JSON.stringify(payload[originKey])){
                    state.changes = true;
                    // console.log('changes updated =', state.changes)
                    // console.log('tab =', originTab)
                    // console.log(state.selections[originTab])
                    // console.log(payload[originKey])
                }
                // console.log('selections', state.selections)
        }
        console.log('changes', state.changes)
        
        // }
        
    // }
        // if (JSON.stringify())
        // state.changes++;
        // console.log('changes updated =', state.changes)
        // console.log('payload =', payload)
    }
};