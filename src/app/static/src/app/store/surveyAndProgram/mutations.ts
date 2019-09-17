import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {PayloadWithType} from "../../types";
import {ProgrammeResponse, SurveyResponse, AncResponse} from "../../generated";

type SurveyAndProgramMutation = Mutation<SurveyAndProgramDataState>

export interface SurveyAndProgramMutations {
    SurveyLoaded: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation,
    ProgramLoaded: SurveyAndProgramMutation
    ProgramError: SurveyAndProgramMutation,
    ANCLoaded: SurveyAndProgramMutation
    ANCError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<SurveyResponse>) {
        state.survey = action.payload;
        state.surveyError = "";
    },

    SurveyError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.surveyError = action.payload;
    },

    ProgramLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<ProgrammeResponse>) {
        state.program = action.payload;
        state.programError = "";
    },

    ProgramError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.programError = action.payload;
    },

    ANCLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<AncResponse>) {
        state.anc = action.payload;
        state.ancError = "";
    },

    ANCError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.ancError = action.payload;
    }
};
