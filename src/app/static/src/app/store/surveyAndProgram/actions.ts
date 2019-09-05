import {ActionContext, ActionTree, Commit} from 'vuex';
import {RootState} from "../../root";
import {DataType} from "../filteredData/filteredData";
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

function commitSelectedDataTypeUpdated(commit: Commit, dataType: DataType) {
    commit("filteredData/SelectedDataTypeUpdated",
        {type: "SelectedDataTypeUpdated", payload: dataType}, {root: true})
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyLoaded")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData)
            .then(() => {
                commitSelectedDataTypeUpdated(commit, DataType.Survey);
            });
    },

    async uploadProgram({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ProgramError")
            .withSuccess("ProgramLoaded")
            .postAndReturn<ProgrammeResponse>("/disease/program/", formData)
            .then(() => {
                commitSelectedDataTypeUpdated(commit, DataType.Program);
            });
    },

    async uploadANC({commit}, formData) {
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ANCError")
            .withSuccess("ANCLoaded")
            .postAndReturn<ProgrammeResponse>("/disease/anc/", formData)
            .then(() => {
                commitSelectedDataTypeUpdated(commit, DataType.ANC);
            });
    }
};
