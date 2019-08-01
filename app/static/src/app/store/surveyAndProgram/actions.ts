import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {GeoJSON} from "geojson";
import {api} from "../../apiService";

export type SurveyAndProgramActionTypes = "SurveyLoaded" | "SurveyError"

export interface SurveyAndProgramPayload extends ActionPayload {
    type: SurveyAndProgramActionTypes
}

export interface SurveyLoaded extends SurveyAndProgramPayload {
    geoJson: string
}

export interface SurveyError extends SurveyAndProgramPayload {
    error: string
}

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, file: File) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    uploadSurvey({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        api.post<GeoJSON>("/survey/", formData)
            .then((payload) => {
                commit<SurveyAndProgramPayload>({type: "SurveyLoaded", payload});
            })
            .catch((error: Error) => {
                commit<SurveyAndProgramPayload>({type: 'SurveyError', payload: error.message});
            });
    }
};
