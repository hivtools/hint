import {Module} from "vuex";
import {RootState} from "../../root";
import {getters} from "./getters";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";

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
                textKey: "uploadBaseline"
            },
            {
                number: 2,
                textKey: "uploadSurvey"
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


const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const stepper: Module<StepperState, RootState> = {
    namespaced,
    state: {...initialStepperState(), ...existingState && existingState.stepper},
    getters,
    actions,
    mutations
};
