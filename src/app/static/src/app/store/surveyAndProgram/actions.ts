import {ActionContext, ActionTree} from 'vuex';
import {RootState} from "../../root";
import {DataType} from "../selectedData/selectedData";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {ProgrammeResponse, SurveyResponse} from "../../generated";

export type SurveyAndProgramActionTypes = "SurveyLoaded" | "ProgramLoaded" | "ANCLoaded"
export type SurveyAndProgramActionErrorTypes = "SurveyError" | "ProgramError" | "ANCError"

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void,
    uploadProgram: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void,
    uploadANC: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyLoaded")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData)
            .then(() => {
                commit("selectedData/SelectedDataUpdated", {type: "SelectedDataUpdated", payload: DataType.Survey}, {root: true})
            });
    },

    async uploadProgram({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ProgramError")
            .withSuccess("ProgramLoaded")
            .postAndReturn<ProgrammeResponse>("/disease/program/", formData)
            .then(() => {
                commit("selectedData/SelectedDataUpdated", {type: "SelectedDataUpdated", payload: DataType.Program}, {root: true})
            });
    },

    async uploadANC({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ANCError")
            .withSuccess("ANCLoaded")
            .postAndReturn<ProgrammeResponse>("/disease/anc/", formData)
            .then(() => {
                commit("selectedData/SelectedDataUpdated", {type: "SelectedDataUpdated", payload: DataType.ANC}, {root: true})
            });
    }
};
