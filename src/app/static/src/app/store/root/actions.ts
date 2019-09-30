import {ActionContext, ActionTree, Store} from "vuex";
import {RootState} from "../../root";
import {StepDescription} from "../stepper/stepper";

export interface RootActions {
    validate: (store: ActionContext<RootState, RootState>) => void;
}
export const actions: ActionTree<RootState, RootState> & RootActions = {

    validate(store) {
        const {state, getters, commit} = store;
        const invalidSteps = state.stepper.steps.map((s: StepDescription) => s.number)
            .filter((i: number) => i < state.stepper!!.activeStep && !getters["stepper/complete"][i]);

        if (invalidSteps.length > 0) {
            commit({type: "Reset"});
        }
    }
};
