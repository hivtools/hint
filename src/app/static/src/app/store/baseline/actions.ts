import {ActionContext, ActionTree, Dispatch} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {PjnzResponse, PopulationResponse, ShapeResponse, ValidateBaselineResponse} from "../../generated";
import {BaselineMutation} from "./mutations";
import qs from "qs";
import {findResource, getFilenameFromImportUrl, getFilenameFromUploadFormData} from "../../utils";
import {DatasetResourceSet} from "../../types";

export interface BaselineActions {
    refreshDatasetMetadata: (store: ActionContext<BaselineState, RootState>) => void
    importPJNZ: (store: ActionContext<BaselineState, RootState>, url: string) => void
    importShape: (store: ActionContext<BaselineState, RootState>, url: string) => void,
    importPopulation: (store: ActionContext<BaselineState, RootState>, url: string) => void,
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void
    uploadShape: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void,
    uploadPopulation: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void,
    deletePJNZ: (store: ActionContext<BaselineState, RootState>) => void
    deleteShape: (store: ActionContext<BaselineState, RootState>) => void,
    deleteAll: (store: ActionContext<BaselineState, RootState>) => void,
    deletePopulation: (store: ActionContext<BaselineState, RootState>) => void,
    getBaselineData: (store: ActionContext<BaselineState, RootState>) => void
    validate: (store: ActionContext<BaselineState, RootState>) => void
}

const uploadCallback = (dispatch: Dispatch, response: any) => {
    if (response) {
        dispatch('validate');
    }
    dispatch("surveyAndProgram/validateSurveyAndProgramData", {}, {root: true});
}

interface UploadImportOptions {
    url: string
    payload: FormData | string
}


async function uploadOrImportPJNZ(context: ActionContext<BaselineState, RootState>, options: UploadImportOptions, filename: string) {
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

async function uploadOrImportPopulation(context: ActionContext<BaselineState, RootState>, options: UploadImportOptions, filename: string) {
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

async function uploadOrImportShape(context: ActionContext<BaselineState, RootState>, options: UploadImportOptions, filename: string) {
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
            }
        });
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    async refreshDatasetMetadata(context) {
        const {commit, state, rootState} = context
        if (state.selectedDataset) {
            const schemas = rootState.adr.schemas!
            await api(context)
                .ignoreErrors()
                .ignoreSuccess()
                .get(`/adr/datasets/${state.selectedDataset.id}`)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const pjnz = findResource(metadata, schemas.pjnz);
                        const pop = findResource(metadata, schemas.population);
                        const shape = findResource(metadata, schemas.shape);
                        const survey = findResource(metadata, schemas.survey);
                        const program = findResource(metadata, schemas.programme);
                        const anc = findResource(metadata, schemas.anc);

                        commit(BaselineMutation.UpdateDatasetResources,
                            {pjnz, pop, shape, survey, program, anc} as DatasetResourceSet)
                    }
                });
        }
    },

    async importPJNZ(context, url) {
        await uploadOrImportPJNZ(context, {url: "/adr/pjnz/", payload: qs.stringify({url})},
            getFilenameFromImportUrl(url));
    },

    async importPopulation(context, url) {
        await uploadOrImportPopulation(context, {url: "/adr/population/", payload: qs.stringify({url})},
            getFilenameFromImportUrl(url));
    },

    async importShape(context, url) {
        await uploadOrImportShape(context, {url: "/adr/shape/", payload: qs.stringify({url})},
            getFilenameFromImportUrl(url));
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
                    dispatch("surveyAndProgram/deleteAll", {}, {root: true});
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
                    dispatch("surveyAndProgram/deleteAll", {}, {root: true});
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
                    dispatch("surveyAndProgram/deleteAll", {}, {root: true});
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
