import {Module} from "vuex";
import {RootState} from "../../root";
import {getters} from "./getters";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {Translations} from "../../translations/locales";

export interface StepDescription {
    number: number,
    text: keyof Translations
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
                text: "uploadBaseline"
            },
            {
                number: 2,
                text: "uploadSurvey"
            },
            {
                number: 3,
                text: "modelOptions"
            },
            {
                number: 4,
                text: "runModel"
            },
            {
                number: 5,
                text: "reviewOutput"
            },
            {
                number: 6,
                text: "downloadResults"
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
