import {Mutation, MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";
import {DataType} from "../filteredData/filteredData";
import {initialModelOptionsState} from "../modelOptions/modelOptions";
import {initialModelRunState} from "../modelRun/modelRun";
import {initialModelOutputState} from "../modelOutput/modelOutput";

export interface RootMutations {
    Reset: Mutation<RootState>
    ResetInputs: Mutation<RootState>
}

export const mutations: MutationTree<RootState> & RootMutations = {
    Reset(state: RootState) {

        Object.assign(state, emptyState());

        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
    },

    ResetInputs(state: RootState) {

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

    ResetOptions(state: RootState) {
        Object.assign(state.modelOptions, initialModelOptionsState());
    },

    ResetOutputs(state: RootState) {
        Object.assign(state.modelRun, initialModelRunState());
        state.modelRun.ready = true;
        Object.assign(state.modelOutput, initialModelOutputState());
    }

};
