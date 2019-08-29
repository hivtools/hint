import {ActionContext, ActionTree, Payload} from 'vuex';
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {SurveyResponse} from "../../types";

export type SurveyAndProgramActionTypes = "SurveyLoaded" | "SurveyError"

export interface SurveyAndProgramPayload<T> extends Payload {
    type: SurveyAndProgramActionTypes
    payload: T
}

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, file: File) => void,
    _uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey(store, file) {
        let formData = new FormData();
        formData.append('file', file);
        await this._uploadSurvey(store, formData)
    },

    async _uploadSurvey({commit}, formData) {
        const payload = await api()
            .commitFirstErrorAsType(commit, "SurveyError")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData);

        payload && commit<SurveyAndProgramPayload<SurveyResponse>>({type: "SurveyLoaded", payload});
    },
};
