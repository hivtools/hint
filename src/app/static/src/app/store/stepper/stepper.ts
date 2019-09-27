import {Module} from "vuex";
import {RootState} from "../../root";
import {getters} from "./getters";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface StepDescription {
    number: number,
    text: string
}

export interface StepperState {
    activeStep: number
    steps: StepDescription[]
}

export const initialStepperState: StepperState = {
    activeStep: 1,
    steps: [
        {
            number: 1,
            text: "Upload baseline data"
        },
        {
            number: 2,
            text: "Upload survey and programme data"
        },
        {
            number: 3,
            text: "Review uploads"
        },
        {
            number: 4,
            text: "Run model"
        },
        {
            number: 5,
            text: "Review output"
        }]
};


const namespaced: boolean = true;

export const stepper: Module<StepperState, RootState> = {
    namespaced,
    state: initialStepperState,
    getters,
    actions,
    mutations
};
