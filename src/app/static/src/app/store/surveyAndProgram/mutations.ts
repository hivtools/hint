import {Mutation, MutationTree} from 'vuex';
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {SurveyAndProgramPayload, SurveyResponse} from "./actions";

interface SurveyAndProgramMutation extends Mutation<SurveyAndProgramDataState> {
    payload?: SurveyAndProgramPayload<any>
}

export interface SurveyAndProgramMutations {
    SurveyLoaded: SurveyAndProgramMutation
    SurveyError: SurveyAndProgramMutation
}

export const mutations: MutationTree<SurveyAndProgramDataState> & SurveyAndProgramMutations = {
    SurveyLoaded(state: SurveyAndProgramDataState, action: SurveyAndProgramPayload<SurveyResponse>) {
        state.surveyFileName = action.payload.filename;
        state.surveyGeoJson = action.payload.data.geoJson;
    },

    SurveyError(state: SurveyAndProgramDataState, action: SurveyAndProgramPayload<string>) {
        state.surveyError = action.payload;
    }
};
