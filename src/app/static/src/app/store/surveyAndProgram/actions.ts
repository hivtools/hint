import {ActionContext, ActionTree, Commit} from 'vuex';
import {RootState} from "../../root";
import {DataType} from "../filteredData/filteredData";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../generated";
import {BaselineErrorActionTypes} from "../baseline/actions";

export type SurveyAndProgramActionTypes = "SurveyUpdated" | "ProgramUpdated" | "ANCUpdated"
export type SurveyAndProgramActionErrorTypes = "SurveyError" | "ProgramError" | "ANCError"

export interface SurveyAndProgramActions {
    uploadSurvey: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void,
    uploadProgram: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void,
    uploadANC: (store: ActionContext<SurveyAndProgramDataState, RootState>, formData: FormData) => void
    getSurveyAndProgramData: (store: ActionContext<SurveyAndProgramDataState, RootState>) => void;
}

function commitSelectedDataTypeUpdated(commit: Commit, dataType: DataType) {
    commit("filteredData/SelectedDataTypeUpdated",
        {type: "SelectedDataTypeUpdated", payload: dataType}, {root: true})
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, formData) {
        commit({type: "SurveyUpdated", payload: null});
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyUpdated")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData)
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.Survey);
                }
            });
    },

    async uploadProgram({commit}, formData) {
        commit({type: "ProgramUpdated", payload: null});
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ProgramError")
            .withSuccess("ProgramUpdated")
            .postAndReturn<ProgrammeResponse>("/disease/programme/", formData)
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.Program);
                }
            });
    },

    async uploadANC({commit}, formData) {
        commit({type: "ANCUpdated", payload: null});
        await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ANCError")
            .withSuccess("ANCUpdated")
            .postAndReturn<ProgrammeResponse>("/disease/anc/", formData)
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.ANC);
                }
            });
    },

    async getSurveyAndProgramData({commit}) {

        await Promise.all(
            [api<SurveyAndProgramActionTypes, BaselineErrorActionTypes>(commit)
                .ignoreErrors()
                .withSuccess("SurveyUpdated")
                .get<SurveyResponse>("/disease/survey/"),
                api<SurveyAndProgramActionTypes, BaselineErrorActionTypes>(commit)
                    .ignoreErrors()
                    .withSuccess("ProgramUpdated")
                    .get<ProgrammeResponse>("/disease/programme/"),
                api<SurveyAndProgramActionTypes, BaselineErrorActionTypes>(commit)
                    .ignoreErrors()
                    .withSuccess("ANCUpdated")
                    .get<AncResponse>("/disease/anc/")]);

        commit({type: "Ready", payload: true});
    }
};
