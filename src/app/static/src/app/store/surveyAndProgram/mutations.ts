import {MutationTree} from 'vuex';
import {DataType, SurveyAndProgramState} from "./surveyAndProgram";
import {PayloadWithType} from "../../types";
import {AncResponse, ProgrammeResponse, SurveyResponse, Error} from "../../generated";
import {ReadyState} from "../../root";

export enum SurveyAndProgramMutation {
    SelectedDataTypeUpdated = "SelectedDataTypeUpdated",
    SurveyUpdated = "SurveyUpdated",
    SurveyError = "SurveyError",
    SurveyErroredFile = "SurveyErroredFile",
    ProgramUpdated = "ProgramUpdated",
    ProgramError = "ProgramError",
    ProgramErroredFile = "ProgramErroredFile",
    ANCUpdated = "ANCUpdated",
    ANCError = "ANCError",
    ANCErroredFile = "ANCErroredFile",
    Ready = "Ready"
}

export const SurveyAndProgramUpdates = [
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
        state.surveyErroredFile = null;
    },

    [SurveyAndProgramMutation.SurveyError](state: SurveyAndProgramState, action: PayloadWithType<Error>) {
        state.surveyError = action.payload;
    },

    [SurveyAndProgramMutation.SurveyErroredFile](state: SurveyAndProgramState, action: PayloadWithType<string>) {
        state.surveyErroredFile = action.payload;
    },

    [SurveyAndProgramMutation.ProgramUpdated](state: SurveyAndProgramState, action: PayloadWithType<ProgrammeResponse>) {
        state.program = action.payload;
        state.programError = null;
        state.programErroredFile = null;
    },

    [SurveyAndProgramMutation.ProgramError](state: SurveyAndProgramState, action: PayloadWithType<Error>) {
        state.programError = action.payload;
    },

    [SurveyAndProgramMutation.ProgramErroredFile](state: SurveyAndProgramState, action: PayloadWithType<string>) {
        state.programErroredFile = action.payload;
    },

    [SurveyAndProgramMutation.ANCUpdated](state: SurveyAndProgramState, action: PayloadWithType<AncResponse>) {
        state.anc = action.payload;
        state.ancError = null;
        state.ancErroredFile = null;
    },

    [SurveyAndProgramMutation.ANCError](state: SurveyAndProgramState, action: PayloadWithType<Error>) {
        state.ancError = action.payload;
    },

    [SurveyAndProgramMutation.ANCErroredFile](state: SurveyAndProgramState, action: PayloadWithType<string>) {
        state.ancErroredFile = action.payload;
    },

    [SurveyAndProgramMutation.Ready](state: ReadyState) {
        state.ready = true;
    }
};
