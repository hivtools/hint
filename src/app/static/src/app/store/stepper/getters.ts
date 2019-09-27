import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {StepperState} from "./stepper";

interface StepperGetters {
    ready: Getter<StepperState, RootState>,
    complete: Getter<StepperState, RootState>
}

export const getters: StepperGetters & GetterTree<StepperState, RootState> = {
    ready: (state: StepperState, getters: any, rootState: RootState) => {
        return rootState.baseline.ready && rootState.surveyAndProgram.ready
    },
    complete: (state: StepperState, getters: any, rootState: RootState, rootGetters: any) => {
        return {
            1: rootGetters['baseline/complete'],
            2: rootGetters['surveyAndProgram/complete'],
            3: rootGetters['surveyAndProgram/complete'], // for now just mark as complete as soon as it's ready
            4: rootState.modelRun.success,
            5: false
        }
    }
};
