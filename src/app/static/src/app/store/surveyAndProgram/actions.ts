import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {SurveyResponse} from "../../types";

export type SurveyAndProgramActionTypes = "SurveyLoaded"
export type SurveyAndProgramActionErrorTypes = "SurveyError"

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, formData) {

        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyLoaded")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData);
    }
};
