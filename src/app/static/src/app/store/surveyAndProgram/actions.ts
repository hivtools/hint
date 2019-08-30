import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {SurveyResponse} from "../../types";

export type SurveyAndProgramActionTypes = "SurveyLoaded"
export type SurveyAndProgramActionErrorTypes = "SurveyError"

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, file: File) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyLoaded")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData);
    }
};
