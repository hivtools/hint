import {ActionContext, ActionTree, Commit} from 'vuex';
import {FileType, SurveyAndProgramState} from "./surveyAndProgram";
import {api} from "../../apiService";
import {AncResponse, ProgrammeResponse, SurveyResponse} from "../../generated";
import {SurveyAndProgramMutation} from "./mutations";
import {buildData, freezer, getFilenameFromImportUrl, getFilenameFromUploadFormData} from "../../utils";
import {GenericChartMutation} from "../genericChart/mutations";
import {UploadImportPayload} from "../../types";
import { RootState } from '../../root';
import {Feature} from "geojson";

export interface SurveyAndProgramActions {
    importSurvey: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    importProgram: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    importANC: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    importVmmc: (store: ActionContext<SurveyAndProgramState, RootState>, url: string) => void,
    uploadSurvey: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void,
    uploadProgram: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void,
    uploadANC: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void
    uploadVmmc: (store: ActionContext<SurveyAndProgramState, RootState>, formData: FormData) => void
    getSurveyAndProgramData: (store: ActionContext<SurveyAndProgramState, RootState>) => void;
    deleteSurvey: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteProgram: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteANC: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteVmmc: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    deleteAll: (store: ActionContext<SurveyAndProgramState, RootState>) => void
    validateSurveyAndProgramData: (store: ActionContext<SurveyAndProgramState, RootState>) => void;
    setSurveyResponse: (store: ActionContext<SurveyAndProgramState, RootState>, data: SurveyResponse) => void;
    setProgramResponse: (store: ActionContext<SurveyAndProgramState, RootState>, data: ProgrammeResponse) => void;
    setAncResponse: (store: ActionContext<SurveyAndProgramState, RootState>, data: AncResponse) => void;
}

const enum DATASET_TYPE {
    ANC = "anc",
    ART = "art",
    SURVEY = "survey",
    VMMC = "vmmc"
}

function commitClearGenericChartDataset(commit: Commit, dataType: string) {
    commit({type: `genericChart/${GenericChartMutation.ClearDataset}`, payload: dataType}, {root: true});
}

interface UploadImportOptions {
    url: string
    payload: FormData | UploadImportPayload
}

async function uploadOrImportANC(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions,
                                 filename: string) {
    const {commit, dispatch} = context;
    commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});
    commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.ANC, warnings: []}});
    commitClearGenericChartDataset(commit, DATASET_TYPE.ANC);

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.ANCError)
        .ignoreSuccess()
        .postAndReturn<ProgrammeResponse>(getUrlWithQuery(options.url), options.payload)
        .then(async (response) => {
            if (response) {
                await dispatch("setAncResponse", response.data)
                commit({
                    type: SurveyAndProgramMutation.WarningsFetched,
                    payload: {type: FileType.ANC, warnings: response.data.warnings}
                })
            } else {
                commit({type: SurveyAndProgramMutation.ANCErroredFile, payload: filename});
            }
        });
}

async function uploadOrImportProgram(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions,
                                     filename: string) {
    const {commit, dispatch} = context;
    commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: null});
    commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.Programme, warnings: []}});
    commitClearGenericChartDataset(commit, DATASET_TYPE.ART);

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.ProgramError)
        .ignoreSuccess()
        .postAndReturn<ProgrammeResponse>(getUrlWithQuery(options.url), options.payload)
        .then(async (response) => {
            if (response) {
                await dispatch("setProgramResponse", response.data)
                commit({
                    type: SurveyAndProgramMutation.WarningsFetched,
                    payload: {type: FileType.Programme, warnings: response.data.warnings}
                })
            } else {
                commit({type: SurveyAndProgramMutation.ProgramErroredFile, payload: filename});
            }
        });
}

async function uploadOrImportSurvey(context: ActionContext<SurveyAndProgramState, RootState>, options: UploadImportOptions,
                                    filename: string) {
    const {commit, dispatch} = context;
    commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: null});
    commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.Survey, warnings: []}});

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.SurveyError)
        .ignoreSuccess()
        .postAndReturn<SurveyResponse>(getUrlWithQuery(options.url), options.payload)
        .then(async (response) => {
            if (response) {
                await dispatch("setSurveyResponse", response.data)
                commit({
                    type: SurveyAndProgramMutation.WarningsFetched,
                    payload: {type: FileType.Survey, warnings: response.data.warnings}
                })
            } else {
                commit({type: SurveyAndProgramMutation.SurveyErroredFile, payload: filename});
            }
        });
}

async function uploadOrImportVmmc(context: ActionContext<SurveyAndProgramState, RootState>,
                                  options: UploadImportOptions, filename: string) {
    const {commit} = context;
    commit({type: SurveyAndProgramMutation.VmmcUpdated, payload: null});
    commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.Vmmc, warnings: []}});
    commitClearGenericChartDataset(commit, DATASET_TYPE.VMMC);

    await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
        .withError(SurveyAndProgramMutation.VmmcError)
        .withSuccess(SurveyAndProgramMutation.VmmcUpdated)
        .freezeResponse()
        .postAndReturn<SurveyResponse>(getUrlWithQuery(options.url), options.payload)
        .then((response) => {
            if (response) {
                commit({
                    type: SurveyAndProgramMutation.WarningsFetched,
                    payload: {type: FileType.Vmmc, warnings: response.data.warnings}
                })
            } else {
                commit({type: SurveyAndProgramMutation.VmmcErroredFile, payload: filename});
            }
        });
}

export const actions: ActionTree<SurveyAndProgramState, RootState> & SurveyAndProgramActions = {

    async importSurvey(context, url) {
        if (url) {
            const data = buildData (context.rootState.baseline?.selectedDataset, url, "survey")
            await uploadOrImportSurvey(context, {url: "/adr/survey/", payload: data},
                getFilenameFromImportUrl(url));
        }
    },

    async importProgram(context, url) {
        if (url) {
            const data = buildData (context.rootState.baseline?.selectedDataset, url, "program")
            await uploadOrImportProgram(context, {url: "/adr/programme/", payload: data},
                getFilenameFromImportUrl(url));
        }
    },

    async importANC(context, url) {
        if (url) {
            const data = buildData (context.rootState.baseline?.selectedDataset, url, "anc")
            await uploadOrImportANC(context, {url: "/adr/anc/", payload: data},
                getFilenameFromImportUrl(url))
        }
    },

    async importVmmc(context, url) {
        if (url) {
            const data = buildData (context.rootState.baseline?.selectedDataset, url, "vmmc")
            await uploadOrImportVmmc(context, {url: "/adr/vmmc/", payload: data},
                getFilenameFromImportUrl(url))
        }
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

    async uploadVmmc(context, formData) {
        await uploadOrImportVmmc(context, {url: "/disease/vmmc/", payload: formData},
            getFilenameFromUploadFormData(formData))
    },

    async deleteSurvey(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/survey/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: null});
                commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.Survey, warnings: []}});
            });
    },

    async deleteProgram(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/programme/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: null});
                commitClearGenericChartDataset(commit, DATASET_TYPE.ART)
                commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.Programme, warnings: []}});
            });
    },

    async deleteANC(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/anc/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.ANCUpdated, payload: null});
                commitClearGenericChartDataset(commit, DATASET_TYPE.ANC)
                commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.ANC, warnings: []}});
            });
    },

    async deleteVmmc(context) {
        const {commit} = context;
        await api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
            .delete("/disease/vmmc/")
            .then(() => {
                commit({type: SurveyAndProgramMutation.VmmcUpdated, payload: null});
                commitClearGenericChartDataset(commit, DATASET_TYPE.VMMC)
                commit({type: SurveyAndProgramMutation.WarningsFetched, payload: {type: FileType.Vmmc, warnings: []}});
            });
    },

    async deleteAll(store) {
        await Promise.all([
            actions.deleteSurvey(store),
            actions.deleteProgram(store),
            actions.deleteANC(store),
            actions.deleteVmmc(store)
        ]);
    },

    async getSurveyAndProgramData(context) {
        const {commit, dispatch} = context;
        await Promise.all(
            [
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .ignoreSuccess()
                    .get<SurveyResponse>(getUrlWithQuery("/disease/survey/"))
                    .then(async(response) => {
                        if (response && response.data) {
                            await dispatch("setSurveyResponse", response.data)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .ignoreSuccess()
                    .get<ProgrammeResponse>(getUrlWithQuery("/disease/programme/"))
                    .then(async (response) => {
                        if (response && response.data) {
                            await dispatch("setProgramResponse", response.data)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .ignoreSuccess()
                    .get<AncResponse>(getUrlWithQuery("/disease/anc/"))
                    .then(async (response) => {
                        if (response && response.data) {
                            await dispatch("setAncResponse", response.data)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .ignoreErrors()
                    .withSuccess(SurveyAndProgramMutation.VmmcUpdated)
                    .freezeResponse()
                    .get<AncResponse>(getUrlWithQuery("/disease/vmmc/"))
            ]);

        commit({type: SurveyAndProgramMutation.Ready, payload: true});
    },

    async validateSurveyAndProgramData(context) {
        const {commit, dispatch} = context;

        await Promise.all(
            [
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.SurveyError)
                    .ignoreSuccess()
                    .get<SurveyResponse>(getUrlWithQuery("/disease/survey/"))
                    .then(async (response) => {
                        if (response && response.data) {
                            await dispatch("setSurveyResponse", response.data)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.ProgramError)
                    .ignoreSuccess()
                    .get<ProgrammeResponse>(getUrlWithQuery("/disease/programme/"))
                    .then(async (response) => {
                        if (response && response.data) {
                            await dispatch("setProgramResponse", response.data)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.ANCError)
                    .ignoreSuccess()
                    .get<AncResponse>(getUrlWithQuery("/disease/anc/"))
                    .then(async (response) => {
                        if (response && response.data) {
                            await dispatch("setAncResponse", response.data)
                        }
                    }),
                api<SurveyAndProgramMutation, SurveyAndProgramMutation>(context)
                    .withError(SurveyAndProgramMutation.VmmcError)
                    .withSuccess(SurveyAndProgramMutation.VmmcUpdated)
                    .freezeResponse()
                    .get<AncResponse>(getUrlWithQuery("/disease/vmmc/"))
            ]);
        commit({type: SurveyAndProgramMutation.Ready, payload: true});
    },

    async setSurveyResponse(context: ActionContext<SurveyAndProgramState, RootState>, response: SurveyResponse) {
        const {commit, rootState} = context;
        const shapeData = rootState.baseline.shape;
        if (shapeData) {
            response.data = getDataWithAreaLevel(response.data, shapeData.data.features as Feature[])
        }
        commit({type: SurveyAndProgramMutation.SurveyUpdated, payload: freezer.deepFreeze(response)})
    },

    async setProgramResponse(context: ActionContext<SurveyAndProgramState, RootState>, response: ProgrammeResponse) {
        const {commit, rootState} = context;
        const shapeData = rootState.baseline.shape;
        if (shapeData) {
            response.data = getDataWithAreaLevel(response.data, shapeData.data.features as Feature[])
        }
        commit({type: SurveyAndProgramMutation.ProgramUpdated, payload: freezer.deepFreeze(response)})
    },

    async setAncResponse(context: ActionContext<SurveyAndProgramState, RootState>, response: AncResponse) {
        const {commit, rootState} = context;
        const shapeData = rootState.baseline.shape;
        if (shapeData) {
            response.data = getDataWithAreaLevel(response.data, shapeData.data.features as Feature[])
        }
        commit({type: SurveyAndProgramMutation.ANCUpdated, payload: freezer.deepFreeze(response)})
    }
};

function getUrlWithQuery(url: string) {
    return `${url}?strict=true`
}

type InputData = AncResponse["data"] | SurveyResponse["data"] | ProgrammeResponse["data"]

const getDataWithAreaLevel = <T extends InputData>(data: T, features: Feature[]) => {
    const newData = structuredClone(data);
    for (let i = 0; i < data.length; i++) {
        newData[i]["area_level"] = features.find(f => f.properties!.area_id === data[i].area_id)!.properties!.area_level;
    }
    return newData;
};
