import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../main";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {ShapeResponse} from "../../generated";

export type SurveyAndProgramActionTypes = "SurveyLoaded" | "ProgramLoaded"
export type SurveyAndProgramActionErrorTypes = "SurveyError" | "ProgramError"

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void,
    uploadProgram: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyLoaded")
            .postAndReturn<ShapeResponse>("/disease/survey/", formData);
    },

    async uploadProgram({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ProgramError")
            .withSuccess("ProgramLoaded")
            .postAndReturn<ShapeResponse>("/disease/program/", formData);
    }

};
