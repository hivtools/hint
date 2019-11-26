import {MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";
import {DataType} from "../filteredData/filteredData";
import {initialModelOptionsState} from "../modelOptions/modelOptions";
import {initialModelRunState} from "../modelRun/modelRun";
import {initialModelOutputState} from "../modelOutput/modelOutput";
import {initialPlottingSelectionsState} from "../plottingSelections/plottingSelections";
import {StepDescription} from "../stepper/stepper";

export enum RootMutation {
    Reset = "Reset",
    ResetFilteredDataSelections = "ResetFilteredDataSelections",
    ResetOptions = "ResetOptions",
    ResetOutputs = "ResetOutputs",
    ShowResetConfirmation = "ShowResetConfirmation",
    HideResetConfirmation = "HideResetConfirmation"
}

export const mutations: MutationTree<RootState> = {
    [RootMutation.Reset](state: RootState) {

        Object.assign(state, emptyState());

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
