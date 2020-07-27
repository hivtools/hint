import {MutationTree} from "vuex";
import {RootState} from "../../root";
import {initialModelOptionsState} from "../modelOptions/modelOptions";
import {initialModelRunState} from "../modelRun/modelRun";
import {initialModelOutputState} from "../modelOutput/modelOutput";
import {initialPlottingSelectionsState} from "../plottingSelections/plottingSelections";
import {initialLoadState, LoadState} from "../load/load";
import {initialMetadataState} from "../metadata/metadata";
import {initialErrorsState} from "../errors/errors";
import {initialBaselineState} from "../baseline/baseline";
import {initialSurveyAndProgramState, DataType} from "../surveyAndProgram/surveyAndProgram";
import {PayloadWithType} from "../../types";
import {mutations as languageMutations} from "../language/mutations";
import {initialVersionsState} from "../versions/versions";

export enum RootMutation {
    Reset = "Reset",
    ResetSelectedDataType = "ResetSelectedDataType",
    ResetOptions = "ResetOptions",
    ResetOutputs = "ResetOutputs"
}

export const mutations: MutationTree<RootState> = {
    [RootMutation.Reset](state: RootState, action: PayloadWithType<number>) {

        const maxValidStep = action.payload;

        //We treat the final group of steps 4-6 together - all rely on modelRun and its result. If we're calling Reset
        //at all we assume that these steps will be invalidated but earlier steps may be retainable
        const resetState: RootState = {
            version: state.version,
            language: state.language,
            baseline: maxValidStep < 1 ? initialBaselineState() : state.baseline,
            metadata: maxValidStep < 1 ? initialMetadataState() : state.metadata,
            surveyAndProgram: maxValidStep < 2 ? initialSurveyAndProgramState() : state.surveyAndProgram,
            modelOptions: maxValidStep < 3 ? initialModelOptionsState() : state.modelOptions,
            modelOutput: initialModelOutputState(),
            modelRun: initialModelRunState(),
            plottingSelections: initialPlottingSelectionsState(),
            stepper: state.stepper,
            load: initialLoadState(),
            errors: initialErrorsState(),
            versions: initialVersionsState()
        };
        Object.assign(state, resetState);

        const maxAccessibleStep = maxValidStep < 4 ? Math.max(maxValidStep,1) : 4;
        if (state.stepper.activeStep > maxAccessibleStep) {
            state.stepper.activeStep = maxAccessibleStep;
        }

        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    [RootMutation.ResetSelectedDataType](state: RootState) {
        //TODO: Should this move to SAP since we're removing output from DataType?
        const dataAvailable = (dataType: DataType | null) => {
            if (dataType == null) {
                return true
            }
            switch (dataType) {
                case DataType.ANC:
                    return !!state.surveyAndProgram.anc;
                case DataType.Program:
                    return !!state.surveyAndProgram.program;
                case DataType.Survey:
                    return !!state.surveyAndProgram.survey;
            }
        };

        if (!dataAvailable(state.surveyAndProgram.selectedDataType)) {

            const availableData: number[] = Object.keys(DataType)
                .filter(k => !isNaN(Number(k)) && dataAvailable(Number(k)))
                .map(k => Number(k));

            state.surveyAndProgram.selectedDataType = availableData.length > 0 ? availableData[0] : null;
        }
    },

    [RootMutation.ResetOptions](state: RootState) {
        Object.assign(state.modelOptions, initialModelOptionsState());
    },

    [RootMutation.ResetOutputs](state: RootState) {
        Object.assign(state.modelRun, initialModelRunState());
        state.modelRun.ready = true;
        Object.assign(state.modelOutput, initialModelOutputState());
        const sapSelections = state.plottingSelections.sapChoropleth;
        const colourScales = state.plottingSelections.colourScales;
        Object.assign(state.plottingSelections, {
            ...initialPlottingSelectionsState(),
            sapChoropleth: sapSelections,
            colourScales: colourScales
        });
    },

    ...languageMutations

};
