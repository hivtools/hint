import {ActionContext, ActionTree} from "vuex";
import {StepperState} from "./stepper";
import {RootState} from "../../root";

export interface StepperActions {
    jump: (store: ActionContext<StepperState, RootState>, step: number) => void,
    next: (store: ActionContext<StepperState, RootState>) => void
}

export const actions: StepperActions & ActionTree<StepperState, RootState> = {
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
