import {ActionContext, ActionTree, Commit} from 'vuex';
import {RootState} from "../../root";
import {SurveyAndProgramState, DataType} from "./surveyAndProgram";
import {api} from "../../apiService";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../generated";
import {SurveyAndProgramMutation} from "./mutations";
import qs from 'qs';

export interface SurveyAndProgramActions {
    importSurvey: (store: ActionContext<SurveyAndProgramState, RootState>, url: String) => void,
    importProgram: (store: ActionContext<SurveyAndProgramState, RootState>, url: String) => void,
    importANC: (store: ActionContext<SurveyAndProgramState, RootState>, url: String) => void,
    uploadSurvey: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void,
    uploadProgram: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void,
    uploadANC: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void
    getSurveyAndProgramData: (store: ActionContext<SurveyAndProgramState, RootState>) => void;
    deleteSurvey: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteProgram: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteANC: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteAll: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    selectDataType: (store: ActionContext<SurveyAndProgramState, RootState>, payload: DataType) => void
}

function commitSelectedDataTypeUpdated(commit: Commit, dataType: DataType) {
    commit("surveyAndProgram/SelectedDataTypeUpdated",
        {type: "SelectedDataTypeUpdated", payload: dataType}, {root: true})
}

export const actions: ActionTree<SurveyAndProgramState, RootState> & SurveyAndProgramActions = {

    async importANC(context, url) {
        const {commit} = context;
        commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});

        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .withError(SurveyAndProgramMutation.ANCError)
            .withSuccess(SurveyAndProgramMutation.ANCUpdated)
            .freezeResponse()
            .postAndReturn<ProgrammeResponse>("/adr/anc/", qs.stringify({url}))
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.ANC);
                }
            });
    },

    async importProgram(context, url) {
        const {commit} = context;
        commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: null});

        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .withError(SurveyAndProgramMutation.ProgramError)
            .withSuccess(SurveyAndProgramMutation.ProgramUpdated)
            .freezeResponse()
            .postAndReturn<ProgrammeResponse>("/adr/programme/", qs.stringify({url}))
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.Program);
                }
            });
    },

    importSurvey: async function (context, url) {
        const {commit} = context;
        commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: null});

        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .withError(SurveyAndProgramMutation.SurveyError)
            .withSuccess(SurveyAndProgramMutation.SurveyUpdated)
            .freezeResponse()
            .postAndReturn<SurveyResponse>("/adr/survey/", qs.stringify({url}))
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.Survey);
                }
            });
    },

    selectDataType(context, payload) {
        const {commit} = context;
        commitSelectedDataTypeUpdated(commit, payload);
    },

    async uploadSurvey(context, formData) {
        const {commit} = context;
        commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: null});

        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .withError(SurveyAndProgramMutation.SurveyError)
            .withSuccess(SurveyAndProgramMutation.SurveyUpdated)
            .freezeResponse()
            .postAndReturn<SurveyResponse>("/disease/survey/", formData)
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.Survey);
                }
            });
    },

    async uploadProgram(context, formData) {
        const {commit} = context;
        commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: null});

        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .withError(SurveyAndProgramMutation.ProgramError)
            .withSuccess(SurveyAndProgramMutation.ProgramUpdated)
            .freezeResponse()
            .postAndReturn<ProgrammeResponse>("/disease/programme/", formData)
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.Program);
                }
            });
    },

    async uploadANC(context, formData) {
        const {commit} = context;
        commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});

        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .withError(SurveyAndProgramMutation.ANCError)
            .withSuccess(SurveyAndProgramMutation.ANCUpdated)
            .freezeResponse()
            .postAndReturn<ProgrammeResponse>("/disease/anc/", formData)
            .then((response) => {
                if (response) {
                    commitSelectedDataTypeUpdated(commit, DataType.ANC);
                }
            });
    },

    async deleteSurvey(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/survey/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: null});
            });
    },

    async deleteProgram(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/programme/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: null});
            });
    },

    async deleteANC(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/anc/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});
            });
    },

    async deleteAll(store) {
        await Promise.all([
            actions.deleteSurvey(store),
            actions.deleteProgram(store),
            actions.deleteANC(store)
        ]);
    },

    async getSurveyAndProgramData(context) {
        const {commit} = context;
        await Promise.all(
            [
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .withSuccess(SurveyAndProgramMutation.SurveyUpdated)
                    .freezeResponse()
                    .get<SurveyResponse>("/disease/survey/"),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .withSuccess(SurveyAndProgramMutation.ProgramUpdated)
                    .freezeResponse()
                    .get<ProgrammeResponse>("/disease/programme/"),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .withSuccess(SurveyAndProgramMutation.ANCUpdated)
                    .freezeResponse()
                    .get<AncResponse>("/disease/anc/")
            ]);

        commit({type: SurveyAndProgramMutation.Ready, payload: true});
    }
};
