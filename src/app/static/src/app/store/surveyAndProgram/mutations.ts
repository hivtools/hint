import {MutationTree} from 'vuex';
import {DataType, SurveyAndProgramState} from "./surveyAndProgram";
import {PayloadWithType} from "../../types";
import {AncResponse, ProgrammeResponse, SurveyResponse, Error} from "../../generated";
import {ReadyState} from "../../root";

export enum SurveyAndProgramMutation {
    SelectedDataTypeUpdated = "SelectedDataTypeUpdated",
    SurveyUpdated = "SurveyUpdated",
    SurveyError = "SurveyError",
    ProgramUpdated = "ProgramUpdated",
    ProgramError = "ProgramError",
    ANCUpdated = "ANCUpdated",
    ANCError = "ANCError",
    Ready = "Ready"
}

export const SurveyAndProgramUpdates = [
    SurveyAndProgramMutation.SelectedDataTypeUpdated,
    SurveyAndProgramMutation.SurveyUpdated,
    SurveyAndProgramMutation.ProgramUpdated,
    SurveyAndProgramMutation.ANCUpdated
];

export const mutations: MutationTree<SurveyAndProgramState> = {
    [SurveyAndProgramMutation.SelectedDataTypeUpdated](state: SurveyAndProgramState, action: PayloadWithType<DataType>) {
        state.selectedDataType = action.payload;
    },

    [SurveyAndProgramMutation.SurveyUpdated](state: SurveyAndProgramState, action: PayloadWithType<SurveyResponse>) {
        state.survey = action.payload;
        state.surveyError = null;
    },

    [SurveyAndProgramMutation.SurveyError](state: SurveyAndProgramState, action: PayloadWithType<Error>) {
        state.surveyError = action.payload;
    },

    [SurveyAndProgramMutation.ProgramUpdated](state: SurveyAndProgramState, action: PayloadWithType<ProgrammeResponse>) {
        state.program = action.payload;
        state.programError = null;
    },

    [SurveyAndProgramMutation.ProgramError](state: SurveyAndProgramState, action: PayloadWithType<Error>) {
        state.programError = action.payload;
    },

    [SurveyAndProgramMutation.ANCUpdated](state: SurveyAndProgramState, action: PayloadWithType<AncResponse>) {
        state.anc = action.payload;
        state.ancError = null;
    },

    [SurveyAndProgramMutation.ANCError](state: SurveyAndProgramState, action: PayloadWithType<Error>) {
        state.ancError = action.payload;
    },

    [SurveyAndProgramMutation.Ready](state: ReadyState) {
        state.ready = true;
    }
};
