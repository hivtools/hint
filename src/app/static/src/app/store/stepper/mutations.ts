import {StepperState} from "./stepper";
import {Mutation, MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {localStorageManager} from "../../localStorageManager";

type StepperMutation = Mutation<StepperState>

export interface StepperMutations {
    Jump: StepperMutation
}

export const mutations: StepperMutations & MutationTree<StepperState> = {
    Jump(state: StepperState, action: PayloadWithType<number>) {
        state.activeStep = action.payload;
        localStorageManager.setItem("activeStep", action.payload);
    }
};
