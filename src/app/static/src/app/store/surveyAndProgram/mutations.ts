import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {SurveyAndProgramPayload, SurveyError, SurveyLoaded} from "./actions";

interface SurveyAndProgramMutation extends Mutation<SurveyAndProgramDataState> {
    payload?: SurveyAndProgramPayload
}

export interface SurveyAndProgramMutations {
    SurveyLoaded: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyLoaded(state: SurveyAndProgramDataState, action: SurveyLoaded) {
        state.surveyFileName = action.payload.filename;
        state.surveyGeoJson = action.payload.geoJson;
    },

    SurveyError(state: SurveyAndProgramDataState, action: SurveyError) {
        state.surveyError = action.payload;
    }
};
