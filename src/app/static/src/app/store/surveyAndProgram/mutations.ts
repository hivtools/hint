import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {PayloadWithType, SurveyResponse} from "../../types";

type SurveyAndProgramMutation = Mutation<SurveyAndProgramDataState>

export interface SurveyAndProgramMutations {
    SurveyLoaded: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyLoaded(state: SurveyAndProgramDataState, action: PayloadWithType<SurveyResponse>) {
        state.surveyFileName = action.payload.filename;
        state.surveyGeoJson = action.payload.data.geoJson;
    },

    SurveyError(state: SurveyAndProgramDataState, action: PayloadWithType<string>) {
        state.surveyError = action.payload;
    }
};
