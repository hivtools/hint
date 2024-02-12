import {Module} from "vuex";
import {getters} from "./getters";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState} from "../../root";

export interface StepDescription {
    number: number,
    textKey: string
}

export interface StepperState {
    activeStep: number
    steps: StepDescription[]
}

export const initialStepperState = (): StepperState => {

    return {
        activeStep: 1,
        steps: [
            {
                number: 1,
                textKey: "uploadInputs"
            },
            {
                number: 2,
                textKey: "reviewInputs"
            },
            {
                number: 3,
                textKey: "modelOptions"
            },
            {
                number: 4,
                textKey: "fitModel"
            },
            {
                number: 5,
                textKey: "calibrateModel"
            },
            {
                number: 6,
                textKey: "reviewOutput"
            },
            {
                number: 7,
                textKey: "downloadResults"
            }]
    }
};

const namespaced = true;

export const stepper = (existingState: Partial<RootState> | null): Module<StepperState, RootState> => {
    return {
        namespaced,
        state: {...initialStepperState(), ...existingState && existingState.stepper},
        getters,
        actions,
        mutations
    };
};
