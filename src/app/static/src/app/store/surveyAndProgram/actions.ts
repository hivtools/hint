import {ActionContext, ActionTree, Commit} from 'vuex';
import {RootState} from "../../root";
import {DataType, SurveyAndProgramState} from "./surveyAndProgram";
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

interface UploadImportOptions {
    url: string
    payload: FormData | string
}

async function uploadOrImportANC(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions) {
    const {commit} = context;
    commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.ANCError)
        .withSuccess(SurveyAndProgramMutation.ANCUpdated)
        .freezeResponse()
        .postAndReturn<ProgrammeResponse>(options.url, options.payload)
        .then((response) => {
            if (response) {
                commitSelectedDataTypeUpdated(commit, DataType.ANC);
            }
        });
}

async function uploadOrImportProgram(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions) {
    const {commit} = context;
    commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: null});

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.ProgramError)
        .withSuccess(SurveyAndProgramMutation.ProgramUpdated)
        .freezeResponse()
        .postAndReturn<ProgrammeResponse>(options.url, options.payload)
        .then((response) => {
            if (response) {
                commitSelectedDataTypeUpdated(commit, DataType.Program);
            }
        });
}

async function uploadOrImportSurvey(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions) {
    const {commit} = context;
    commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: null});

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.SurveyError)
        .withSuccess(SurveyAndProgramMutation.SurveyUpdated)
        .freezeResponse()
        .postAndReturn<SurveyResponse>(options.url, options.payload)
        .then((response) => {
            if (response) {
                commitSelectedDataTypeUpdated(commit, DataType.Survey);
            }
        });
}

export const actions: ActionTree<SurveyAndProgramState, RootState> & SurveyAndProgramActions = {

    selectDataType(context, payload) {
        const {commit} = context;
        commitSelectedDataTypeUpdated(commit, payload);
    },

    async importSurvey(context, url) {
        await uploadOrImportSurvey(context, {url: "/adr/survey/", payload: qs.stringify({url})});
    },

    async importProgram(context, url) {
        await uploadOrImportProgram(context, {url: "/adr/programme/", payload: qs.stringify({url})})
    },

    async importANC(context, url) {
        await uploadOrImportANC(context, {url: "/adr/anc/", payload: qs.stringify({url})})
    },

    async uploadSurvey(context, formData) {
        await uploadOrImportSurvey(context, {url: "/disease/survey/", payload: formData})
    },

    async uploadProgram(context, formData) {
        await uploadOrImportProgram(context, {url: "/disease/programme/", payload: formData})
    },

    async uploadANC(context, formData) {
        await uploadOrImportANC(context, {url: "/disease/anc/", payload: formData})
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
