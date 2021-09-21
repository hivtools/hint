import {ActionContext, ActionTree, Commit} from 'vuex';
import {RootState} from "../../root";
import {DataType, SurveyAndProgramState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../generated";
import {SurveyAndProgramMutation} from "./mutations";
import qs from 'qs';
import {getFilenameFromImportUrl, getFilenameFromUploadFormData} from "../../utils";
import {GenericChartMutation} from "../genericChart/mutations";

export interface SurveyAndProgramActions {
    importSurvey: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    importProgram: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    importANC: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    uploadSurvey: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void,
    uploadProgram: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void,
    uploadANC: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void
    getSurveyAndProgramData: (store: ActionContext<SurveyAndProgramState, RootState>) => void;
    deleteSurvey: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteProgram: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteANC: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteAll: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    selectDataType: (store: ActionContext<SurveyAndProgramState, RootState>, payload: DataType) => void
    validateSurveyAndProgramData: (store: ActionContext<SurveyAndProgramState, RootState>) => void;
}

function commitSelectedDataTypeUpdated(commit: Commit, dataType: DataType) {
    commit("surveyAndProgram/SelectedDataTypeUpdated",
        {type: "SelectedDataTypeUpdated", payload: dataType}, {root: true})
}

function commitClearGenericChartDataset(commit: Commit) {
    commit({type: `genericChart/${GenericChartMutation.ClearDataset}`}, {root: true});
}

interface UploadImportOptions {
    url: string
    payload: FormData | string
}

async function uploadOrImportANC(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions,
                                 filename: string) {
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
            } else {
                commit({type: SurveyAndProgramMutation.ANCErroredFile, payload: filename});
            }
            commitClearGenericChartDataset(commit)
        });
}

async function uploadOrImportProgram(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions,
                                     filename: string) {
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
            } else {
                commit({type: SurveyAndProgramMutation.ProgramErroredFile, payload: filename});
            }
            commitClearGenericChartDataset(commit)
        });
}

async function uploadOrImportSurvey(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions,
                                    filename: string) {
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
            } else {
                commit({type: SurveyAndProgramMutation.SurveyErroredFile, payload: filename});
            }
        });
}

export const actions: ActionTree<SurveyAndProgramState, RootState> & SurveyAndProgramActions = {

    selectDataType(context, payload) {
        const {commit} = context;
        commitSelectedDataTypeUpdated(commit, payload);
    },

    async importSurvey(context, url) {
        await uploadOrImportSurvey(context, {url: "/adr/survey/", payload: qs.stringify({url})},
            getFilenameFromImportUrl(url));
    },

    async importProgram(context, url) {
        await uploadOrImportProgram(context, {url: "/adr/programme/", payload: qs.stringify({url})},
            getFilenameFromImportUrl(url));
    },

    async importANC(context, url) {
        await uploadOrImportANC(context, {url: "/adr/anc/", payload: qs.stringify({url})},
            getFilenameFromImportUrl(url))
    },

    async uploadSurvey(context, formData) {
        await uploadOrImportSurvey(context, {url: "/disease/survey/", payload: formData},
            getFilenameFromUploadFormData(formData))
    },

    async uploadProgram(context, formData) {
        await uploadOrImportProgram(context, {url: "/disease/programme/", payload: formData},
            getFilenameFromUploadFormData(formData));
    },

    async uploadANC(context, formData) {
        await uploadOrImportANC(context, {url: "/disease/anc/", payload: formData},
            getFilenameFromUploadFormData(formData))
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
                commitClearGenericChartDataset(commit)
            });
    },

    async deleteANC(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/anc/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});
                commitClearGenericChartDataset(commit)
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
    },

    async validateSurveyAndProgramData(context) {
        const {commit, rootState} = context;
        const successfulDataTypes: DataType[] = []
        const initialSelectedDataType = rootState.surveyAndProgram.selectedDataType!

        await Promise.all(
            [
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.SurveyError)
                    .withSuccess(SurveyAndProgramMutation.SurveyUpdated)
                    .freezeResponse()
                    .get<SurveyResponse>("/disease/survey/")
                    .then((response) => {
                        if (response) {
                            successfulDataTypes.push(DataType.Survey)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.ProgramError)
                    .withSuccess(SurveyAndProgramMutation.ProgramUpdated)
                    .freezeResponse()
                    .get<ProgrammeResponse>("/disease/programme/")
                    .then((response) => {
                        if (response) {
                            successfulDataTypes.push(DataType.Program)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.ANCError)
                    .withSuccess(SurveyAndProgramMutation.ANCUpdated)
                    .freezeResponse()
                    .get<AncResponse>("/disease/anc/")
                    .then((response) => {
                        if (response) {
                            successfulDataTypes.push(DataType.ANC)
                        }
                    })
            ]);
        const selectedTypeSucceeded = successfulDataTypes.some(data => data === initialSelectedDataType)
        if (!selectedTypeSucceeded) {
            const newSelectedDataType = successfulDataTypes.length? successfulDataTypes[0] : null

            commitSelectedDataTypeUpdated(commit, newSelectedDataType!)
        }
        commit({type: SurveyAndProgramMutation.Ready, payload: true});
    }
};
