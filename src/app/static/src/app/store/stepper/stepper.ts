import {Module} from "vuex";
import {getters} from "./getters";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState} from "../../root";
import {Step} from "../../types";

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
        activeStep: Step.UploadInputs,
        steps: [
            {
                number: Step.UploadInputs,
                textKey: "uploadInputs"
            },
            {
                number: Step.ReviewInputs,
                textKey: "reviewInputs"
            },
            {
                number: Step.ModelOptions,
                textKey: "modelOptions"
            },
            {
                number: Step.FitModel,
                textKey: "fitModel"
            },
            {
                number: Step.CalibrateModel,
                textKey: "calibrateModel"
            },
            {
                number: Step.ReviewOutput,
                textKey: "reviewOutput"
            },
            {
                number: Step.SaveResults,
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
