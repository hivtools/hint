import {MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";
import {DataType, initialFilteredDataState} from "../filteredData/filteredData";
import {initialModelOptionsState} from "../modelOptions/modelOptions";
import {initialModelRunState} from "../modelRun/modelRun";
import {initialModelOutputState} from "../modelOutput/modelOutput";
import {initialPlottingSelectionsState} from "../plottingSelections/plottingSelections";
import {data} from "../../../tests/components/plots/barchart/utils.test";
import {initialLoadState, LoadState} from "../load/load";
import {PayloadWithType} from "../../types";
import {Error} from "../../generated";
import {initialMetadataState} from "../metadata/metadata";
import {initialSurveyAndProgramDataState} from "../surveyAndProgram/surveyAndProgram";
import {initialStepperState} from "../stepper/stepper";
import {initialErrorsState} from "../errors/errors";
import {initialBaselineState} from "../baseline/baseline";

export enum RootMutation {
    Reset = "Reset",
    ResetFilteredDataSelections = "ResetFilteredDataSelections",
    ResetOptions = "ResetOptions",
    ResetOutputs = "ResetOutputs"
}

export const mutations: MutationTree<RootState> = {
    [RootMutation.Reset](state: RootState, action: PayloadWithType<number>) {

        const maxValidStep = action.payload;

        Object.assign(state, {
            version: state.version,
            baseline: maxValidStep < 1 ? initialBaselineState() : state.baseline,
            metadata: maxValidStep < 1 ? initialMetadataState() : state.metadata,
            surveyAndProgram: maxValidStep < 2 ? initialSurveyAndProgramDataState() : state.surveyAndProgram,
            modelOptions: maxValidStep < 3 ? initialModelOptionsState() : state.modelOptions,
            modelOutput: maxValidStep <= 6 ? initialModelOutputState() :  state.modelOutput,
            modelRun: maxValidStep <= 6 ? initialModelRunState() :  state.modelRun,
            plottingSelections: maxValidStep <= 6 ? initialPlottingSelectionsState() : state.plottingSelections,
            filteredData: state.filteredData,
            stepper: state.stepper,
            load: state.load,
            errors: state.errors
        });

        //THIS IS A BIT MESSY - WE'RE ASSUMING THE MAX WE CAN GO HERE IS 4, BUT NOT ABOVE
        const maxAccessibleStep = maxValidStep < 4 ? maxValidStep : 4;
        if (state.stepper.activeStep > maxAccessibleStep) {
            state.stepper.activeStep = maxAccessibleStep;
        }

        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    [RootMutation.ResetFilteredDataSelections](state: RootState) {
        const dataAvailable = (dataType: DataType | null) => {
            if (dataType == null) {
                return true
            }
            switch (dataType) {
                case DataType.ANC:
                    return !!state.surveyAndProgram.anc;
                case DataType.Output:
                    return !!state.modelRun.result;
                case DataType.Program:
                    return !!state.surveyAndProgram.program;
                case DataType.Survey:
                    return !!state.surveyAndProgram.survey;
            }
        };

        // only update filtered data state if the selected type is no longer valid
        if (!dataAvailable(state.filteredData.selectedDataType)) {

            const availableData: number[] = Object.keys(DataType)
                .filter(k => !isNaN(Number(k)) && dataAvailable(Number(k)))
                .map(k => Number(k));

            state.filteredData.selectedDataType = availableData.length > 0 ? availableData[0] : null;
        }
    },

    [RootMutation.ResetOptions](state: RootState) {
        Object.assign(state.modelOptions, initialModelOptionsState());
    },

    [RootMutation.ResetOutputs](state: RootState) {
        Object.assign(state.modelRun, initialModelRunState());
        state.modelRun.ready = true;
        Object.assign(state.modelOutput, initialModelOutputState());
        Object.assign(state.plottingSelections, initialPlottingSelectionsState());
    }

};
