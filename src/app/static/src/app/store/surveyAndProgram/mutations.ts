import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {PayloadWithType} from "../../types";
import {ShapeResponse} from "../../generated";

type SurveyAndProgramMutation = Mutation<SurveyAndProgramDataState>

export interface SurveyAndProgramMutations {
    SurveyLoaded: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation,
    ProgramLoaded: SurveyAndProgramMutation
    ProgramError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<ShapeResponse>) {
        state.survey = action.payload;
    },

    SurveyError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.surveyError = action.payload;
    },

    ProgramLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<ShapeResponse>) {
        state.program = action.payload;
    },

    ProgramError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.programError = action.payload;
    }
};
