import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {StepperState} from "./stepper";

export interface StepperActions {
    jump: (store: ActionContext<StepperState, RootState>, step: number) => void
}

export const actions: StepperActions & ActionTree<StepperState, RootState> = {
    jump({commit}, step) {
        commit({type: "Jump", payload: step});
    }
};
