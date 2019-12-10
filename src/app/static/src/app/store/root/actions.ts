import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {StepDescription} from "../stepper/stepper";

export interface RootActions {
    validate: (store: ActionContext<RootState, RootState>) => void;
}

export const actions: ActionTree<RootState, RootState> & RootActions = {
    async validate(store) {
        const {state, getters, commit, dispatch} = store;
        const completeSteps = state.stepper.steps.map((s: StepDescription) => s.number)
            .filter((i: number) => getters["stepper/complete"][i]);
        const maxCompleteOrActive = Math.max(...completeSteps, state.stepper!!.activeStep);

        const invalidSteps = state.stepper.steps.map((s: StepDescription) => s.number)
            .filter((i: number) => i < maxCompleteOrActive && !completeSteps.includes(i));

        if (invalidSteps.length > 0) {
            await Promise.all([
                dispatch("baseline/deleteAll"),
                dispatch("surveyAndProgram/deleteAll")
            ]);
            commit({type: "Reset"});
            commit({type: "load/LoadFailed", payload: {detail: "State is invalid. Resetting all steps."}});
        }
    }
};
