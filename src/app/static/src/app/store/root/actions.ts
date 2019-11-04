import {ActionContext, ActionTree, Store} from "vuex";
import {RootState} from "../../root";
import {StepDescription} from "../stepper/stepper";

export interface RootActions {
    validate: (store: ActionContext<RootState, RootState>) => void;
}
export const actions: ActionTree<RootState, RootState> & RootActions = {
    validate(store) {
        const {state, getters, commit} = store;
        const completeSteps = state.stepper.steps.map((s: StepDescription) => s.number)
                                    .filter((i: number) => getters["stepper/complete"][i]);
        const maxCompleteOrActive = Math.max(...completeSteps, state.stepper!!.activeStep);

        const invalidSteps = state.stepper.steps.map((s: StepDescription) => s.number)
            .filter((i: number) => i < maxCompleteOrActive && !completeSteps.includes(i));

        if (invalidSteps.length > 0) {
            commit({type: "Reset"});
        }
    }
};
