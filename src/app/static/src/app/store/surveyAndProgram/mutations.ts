import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {PayloadWithType} from "../../types";
import {ProgrammeResponse, SurveyResponse, AncResponse} from "../../generated";

type SurveyAndProgramMutation = Mutation<SurveyAndProgramDataState>

export interface SurveyAndProgramMutations {
    SurveyUpdated: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation,
    ProgramUpdated: SurveyAndProgramMutation
    ProgramError: SurveyAndProgramMutation,
    ANCUpdated: SurveyAndProgramMutation
    ANCError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyUpdated(state: SurveyAndProgramDataState, action: PayloadWithType<SurveyResponse>) {
        state.survey = action.payload;
        state.surveyError = "";
    },

    SurveyError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.surveyError = action.payload;
    },

    ProgramUpdated(state: SurveyAndProgramDataState, action: PayloadWithType<ProgrammeResponse>) {
        state.program = action.payload;
        state.programError = "";
    },

    ProgramError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.programError = action.payload;
    },

    ANCUpdated(state: SurveyAndProgramDataState, action: PayloadWithType<AncResponse>) {
        state.anc = action.payload;
        state.ancError = "";
    },

    ANCError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.ancError = action.payload;
    }
};
