import type {StepperState} from "./stepper";
import type {Mutation, MutationTree} from "vuex";
import type {PayloadWithType} from "../../types";

type StepperMutation = Mutation<StepperState>

export interface StepperMutations {
    Jump: StepperMutation
}

export const mutations: StepperMutations & MutationTree<StepperState> = {
    Jump(state: StepperState, action: PayloadWithType<number>) {
        state.activeStep = action.payload;
    }
};
