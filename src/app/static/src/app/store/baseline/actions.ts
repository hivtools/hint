import {ActionContext, ActionTree, Dispatch} from 'vuex';
import {BaselineState} from "./baseline";
import {api} from "../../apiService";
import {PjnzResponse, PopulationResponse, ShapeResponse, ValidateBaselineResponse} from "../../generated";
import {BaselineMutation} from "./mutations";
import qs from "qs";
import {findResource, getFilenameFromImportUrl, getFilenameFromUploadFormData} from "../../utils";
import { DatasetResourceSet, DatasetResource, ADRSchemas } from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {initialChorplethSelections} from "../plottingSelections/plottingSelections";

export interface BaselineActions {
    refreshDatasetMetadata: (store: ActionContext<BaselineState, DataExplorationState>) => void
    importPJNZ: (store: ActionContext<BaselineState, DataExplorationState>, url: string) => void
    importShape: (store: ActionContext<BaselineState, DataExplorationState>, url: string) => void,
    importPopulation: (store: ActionContext<BaselineState, DataExplorationState>, url: string) => void,
    uploadPJNZ: (store: ActionContext<BaselineState, DataExplorationState>, formData: FormData) => void
    uploadShape: (store: ActionContext<BaselineState, DataExplorationState>, formData: FormData) => void,
    uploadPopulation: (store: ActionContext<BaselineState, DataExplorationState>, formData: FormData) => void,
    deletePJNZ: (store: ActionContext<BaselineState, DataExplorationState>) => void
    deleteShape: (store: ActionContext<BaselineState, DataExplorationState>) => void,
    deleteAll: (store: ActionContext<BaselineState, DataExplorationState>) => void,
    deletePopulation: (store: ActionContext<BaselineState, DataExplorationState>) => void,
    getBaselineData: (store: ActionContext<BaselineState, DataExplorationState>) => void
    validate: (store: ActionContext<BaselineState, DataExplorationState>) => void
}

const uploadCallback = async (dispatch: Dispatch, response: any) => {
    if (response) {
        await dispatch('validate');
    }
    await dispatch("surveyAndProgram/validateSurveyAndProgramData", {}, {root: true});
}

interface UploadImportOptions {
    url: string
    payload: FormData | string
}


async function uploadOrImportPJNZ(context: ActionContext<BaselineState, DataExplorationState>, options: UploadImportOptions, filename: string) {
    const {commit, dispatch, state} = context;
    commit({type: BaselineMutation.PJNZUpdated, payload: null});
    await api<BaselineMutation, BaselineMutation>(context)
        .withSuccess(BaselineMutation.PJNZUpdated)
        .withError(BaselineMutation.PJNZUploadError)
        .freezeResponse()
        .postAndReturn<PjnzResponse>(options.url, options.payload)
        .then((response) => {
            if (response) {
                dispatch('metadata/getPlottingMetadata', state.iso3, {root: true});
                dispatch('validate');
            } else {
                commit({type: BaselineMutation.PJNZErroredFile, payload: filename});
            }
            dispatch('surveyAndProgram/validateSurveyAndProgramData', {}, {root: true});
        });
}

async function uploadOrImportPopulation(context: ActionContext<BaselineState, DataExplorationState>, options: UploadImportOptions, filename: string) {
    const {commit, dispatch} = context;
    commit({type: BaselineMutation.PopulationUpdated, payload: null});
    await api<BaselineMutation, BaselineMutation>(context)
        .withSuccess(BaselineMutation.PopulationUpdated)
        .withError(BaselineMutation.PopulationUploadError)
        .freezeResponse()
        .postAndReturn<PopulationResponse>(options.url, options.payload)
        .then((response) => {
            uploadCallback(dispatch, response);
            if (!response) {
                commit({type: BaselineMutation.PopulationErroredFile, payload: filename});
            }
        });
}

async function uploadOrImportShape(context: ActionContext<BaselineState, DataExplorationState>, options: UploadImportOptions, filename: string) {
    const {commit, dispatch} = context;
    commit({type: BaselineMutation.ShapeUpdated, payload: null});
    await api<BaselineMutation, BaselineMutation>(context)
        .withSuccess(BaselineMutation.ShapeUpdated)
        .withError(BaselineMutation.ShapeUploadError)
        .freezeResponse()
        .postAndReturn<ShapeResponse>(options.url, options.payload)
        .then((response) => {
            uploadCallback(dispatch, response);
            if (!response) {
                commit({type: BaselineMutation.ShapeErroredFile, payload: filename});
            } else {
                // Clear SAP Choropleth Selections as new shape file may have different area levels
                commit({
                    type: "plottingSelections/updateSAPChoroplethSelections",
                    payload: initialChorplethSelections()
                }, {root: true})
            }
        });
}

export const actions: ActionTree<BaselineState, DataExplorationState> & BaselineActions = {

    async refreshDatasetMetadata(context) {
        const { commit, state, rootState, rootGetters } = context
        // console.log("refresh getters", rootGetters)
        if (state.selectedDataset) {
            let url = `/adr/datasets/${state.selectedDataset.id}`;
            if (state.selectedDataset.release) {
                url += '?' + new URLSearchParams({release: state.selectedDataset.release});
            }
            const schemas = rootState.adr.schemas!
            await api(context)
                .ignoreErrors()
                .ignoreSuccess()
                .get(url)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const avaliableResources = rootGetters["baseline/selectedDatasetAvailableResources"]
                        const exceptions = { // where DatasetResource keys do not match ADRSchemas keys
                            pop: "population",
                            program: "programme"
                        }
                        const resources: { [k in keyof DatasetResourceSet]?: DatasetResource | null } = {}
                        Object.entries(avaliableResources).forEach(([key, value]) => {
                            const schemaKey = key in exceptions ? exceptions[key as "pop" || "program"] : key
                            resources[key as keyof typeof resources] = value ? findResource(metadata, schemas[schemaKey as keyof ADRSchemas]) : null
                        })

                        commit(BaselineMutation.UpdateDatasetResources,
                            { ...resources } as DatasetResourceSet)
                    }
                });
        }
    },

    async importPJNZ(context, url) {
        if (url) {
            await uploadOrImportPJNZ(context, {url: "/adr/pjnz/", payload: qs.stringify({url})},
                getFilenameFromImportUrl(url));
        }
    },

    async importPopulation(context, url) {
        if (url) {
            await uploadOrImportPopulation(context, {url: "/adr/population/", payload: qs.stringify({url})},
                getFilenameFromImportUrl(url));
        }
    },

    async importShape(context, url) {
        if (url) {
            await uploadOrImportShape(context, {url: "/adr/shape/", payload: qs.stringify({url})},
                getFilenameFromImportUrl(url));
        }
    },

    async uploadPJNZ(context, formData) {
        await uploadOrImportPJNZ(context, {url: "/baseline/pjnz/", payload: formData},
            getFilenameFromUploadFormData(formData));
    },

    async uploadShape(context, formData) {
        await uploadOrImportShape(context, {url: "/baseline/shape/", payload: formData},
            getFilenameFromUploadFormData(formData));
    },

    async uploadPopulation(context, formData) {
        await uploadOrImportPopulation(context, {url: "/baseline/population/", payload: formData},
            getFilenameFromUploadFormData(formData));
    },

    async deletePJNZ(context) {
        const {commit, dispatch} = context;
        await api<BaselineMutation, BaselineMutation>(context)
            .delete("/baseline/pjnz/")
            .then((response) => {
                if (response) {
                    commit({type: BaselineMutation.PJNZUpdated, payload: null});
                    uploadCallback(dispatch, response)
                }
            });
    },

    async deleteShape(context) {
        const {commit, dispatch} = context;
        await api<BaselineMutation, BaselineMutation>(context)
            .delete("/baseline/shape/")
            .then((response) => {
                if (response) {
                    commit({type: BaselineMutation.ShapeUpdated, payload: null});
                    uploadCallback(dispatch, response)
                }
            });
    },

    async deletePopulation(context) {
        const {commit, dispatch} = context;
        await api<BaselineMutation, BaselineMutation>(context)
            .delete("/baseline/population/")
            .then((response) => {
                if (response) {
                    commit({type: BaselineMutation.PopulationUpdated, payload: null});
                    uploadCallback(dispatch, response)
                }
            });
    },

    async deleteAll(store) {
        await Promise.all([
            actions.deletePJNZ(store),
            actions.deleteShape(store),
            actions.deletePopulation(store)
        ]);
    },

    async getBaselineData(context) {
        const {commit, dispatch} = context;
        await Promise.all([
            api<BaselineMutation, BaselineMutation>(context)
                .ignoreErrors()
                .withSuccess(BaselineMutation.PJNZUpdated)
                .freezeResponse()
                .get<PjnzResponse>("/baseline/pjnz/"),
            api<BaselineMutation, BaselineMutation>(context)
                .ignoreErrors()
                .withSuccess(BaselineMutation.PopulationUpdated)
                .freezeResponse()
                .get<PjnzResponse>("/baseline/population/"),
            api<BaselineMutation, BaselineMutation>(context)
                .ignoreErrors()
                .withSuccess(BaselineMutation.ShapeUpdated)
                .freezeResponse()
                .get<PjnzResponse>("/baseline/shape/")
        ]);

        await dispatch('validate');

        commit({type: "Ready", payload: true});
    },

    async validate(context) {
        const {commit} = context;
        commit({type: "Validating", payload: null});
        await api<BaselineMutation, BaselineMutation>(context)
            .withSuccess(BaselineMutation.Validated)
            .withError(BaselineMutation.BaselineError)
            .freezeResponse()
            .get<ValidateBaselineResponse>("/baseline/validate/");
    }
};
