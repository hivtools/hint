import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {StepDescription, StepperState} from "./stepper";
import {localStorageManager} from "../../localStorageManager";

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
    },

    load(store) {
        const {state, getters} = store;
        const activeStep = localStorageManager.getInt("activeStep");

        if (activeStep) {
            const invalidSteps = state.steps.map((s: StepDescription) => s.number)
                .filter((i: number) => i < activeStep && !getters.complete[i]);

            if (invalidSteps.length == 0) {
                actions.jump(store, activeStep);
            } else {
                localStorageManager.removeItem("activeStep");
            }
        }
    }
};
