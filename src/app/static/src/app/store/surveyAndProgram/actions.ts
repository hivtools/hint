import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {SurveyResponse} from "../../types";

export type SurveyAndProgramActionTypes = "SurveyLoaded" | "SurveyError"

export interface SurveyAndProgramPayload<T> extends ActionPayload {
    type: SurveyAndProgramActionTypes
    payload: T
}

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, file: File) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    uploadSurvey({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        // TODO change from any type once survey response added to spec
        api.postAndReturn<any>("/disease/survey/", formData)
            .then((payload) => {
                commit<SurveyAndProgramPayload<SurveyResponse>>({type: "SurveyLoaded", payload});
            })
            .catch((error: Error) => {
                commit<SurveyAndProgramPayload<string>>({type: 'SurveyError', payload: error.message});
            });
    }
};
