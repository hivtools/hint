import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {StepperState} from "./stepper";

interface StepperGetters {
    ready: Getter<StepperState, RootState>,
    complete: Getter<StepperState, RootState>
}

export const getters: StepperGetters & GetterTree<StepperState, RootState> = {
    ready: (state: StepperState, getters: any, rootState: RootState) => {
        return rootState.baseline.ready && rootState.surveyAndProgram.ready && rootState.modelRun.ready
    },
    complete: (state: StepperState, getters: any, rootState: RootState, rootGetters: any) => {
        return {
            1: true,//rootGetters['baseline/complete'] && rootGetters['metadata/complete'],
            2: rootGetters['surveyAndProgram/complete'],
            3: rootGetters['modelOptions/complete'],
            4: rootGetters['modelRun/complete'],
            5: rootGetters['modelRun/complete'],
            6: false
        }
    }
};
