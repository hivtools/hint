import {ActionContext, ActionTree, Commit} from 'vuex';
import {RootState} from "../../root";
import {DataType} from "../filteredData/filteredData";
import {SurveyAndProgramDataState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../generated";
import {BaselineErrorActionTypes} from "../baseline/actions";
import {DynamicFormMeta} from "../../components/forms/types";

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

function commitModelOptionsUpdated(commit: Commit, payload: DynamicFormMeta) {
    commit("modelOptions/update", payload, {root: true})
}

async function fetchModelOptions(commit: Commit) {
    const response = await api(commit)
        .ignoreErrors()
        .get<DynamicFormMeta>("/model/options/");

    if (response) {
        commitModelOptionsUpdated(commit, response);
    }
}

export const actions: ActionTree<SurveyAndProgramDataState, RootState> & SurveyAndProgramActions = {

    async uploadSurvey({commit}, formData) {
        commit({type: "SurveyUpdated", payload: null});
        const response = await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("SurveyError")
            .withSuccess("SurveyUpdated")
            .postAndReturn<SurveyResponse>("/disease/survey/", formData);

        if (response) {
            commitSelectedDataTypeUpdated(commit, DataType.Survey);
            await fetchModelOptions(commit)
        }
    },

    async uploadProgram({commit, state}, formData) {
        commit({type: "ProgramUpdated", payload: null});
        const response = await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ProgramError")
            .withSuccess("ProgramUpdated")
            .postAndReturn<ProgrammeResponse>("/disease/programme/", formData);

        if (response) {
            commitSelectedDataTypeUpdated(commit, DataType.Program);
            if (state.survey) {
                await fetchModelOptions(commit);
            }
        }
    },

    async uploadANC({commit, state}, formData) {
        commit({type: "ANCUpdated", payload: null});
        const response = await api<SurveyAndProgramActionTypes, SurveyAndProgramActionErrorTypes>(commit)
            .withError("ANCError")
            .withSuccess("ANCUpdated")
            .postAndReturn<ProgrammeResponse>("/disease/anc/", formData);

        if (response) {
            commitSelectedDataTypeUpdated(commit, DataType.ANC);
            if (state.survey) {
                await fetchModelOptions(commit);
            }
        }
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

        await fetchModelOptions(commit);

        commit({type: "Ready", payload: true, root: true});
    }
};
