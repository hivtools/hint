import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {StepDescription, StepperState} from "./stepper";

interface StepperGetters {
    ready: Getter<StepperState, RootState>,
    complete: Getter<StepperState, RootState>
    laterCompleteSteps: Getter<StepperState, RootState>
    editsRequireConfirmation: Getter<StepperState, RootState>
}

export const getters: StepperGetters & GetterTree<StepperState, RootState> = {
    ready: (state: StepperState, getters: any, rootState: RootState) => {
        return !!rootState.adrSchemas &&
            rootState.baseline.ready &&
            rootState.surveyAndProgram.ready &&
            rootState.modelRun.ready
    },
    complete: (state: StepperState, getters: any, rootState: RootState, rootGetters: any) => {
        return {
            1: rootGetters['baseline/complete'] && rootGetters['metadata/complete'],
            2: rootGetters['surveyAndProgram/complete'],
            3: rootGetters['modelOptions/complete'],
            // 4: rootGetters['modelRun/complete'],
            4: rootState.modelRun.complete,
            5: rootState.modelCalibrate.complete,
            6: rootState.modelCalibrate.complete,
            7: false
        }
    },
    laterCompleteSteps: (state: StepperState, getters: any) => {
        const activeStep = state.activeStep;
        return state.steps.filter((s: StepDescription) => s.number > activeStep && getters.complete[s.number]);
    },
    editsRequireConfirmation: (state: StepperState, getters: any) => {
        return getters.laterCompleteSteps.length > 0;
    }
};
