import {ActionContext, ActionTree} from "vuex";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {StepperState} from "./stepper";

export interface StepperActions {
    jump: (store: ActionContext<StepperState, DataExplorationState>, step: number) => void,
    next: (store: ActionContext<StepperState, DataExplorationState>) => void
}

export const actions: StepperActions & ActionTree<StepperState, DataExplorationState> = {
    jump({commit}, step) {
        commit({type: "Jump", payload: step});
    },

    next(store) {
        const {state, getters} = store;
        if (getters.complete[state.activeStep]) {
            actions.jump(store, state.activeStep + 1);
        }
    }
};
