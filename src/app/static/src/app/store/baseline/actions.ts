import {ActionContext, ActionTree} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {PjnzResponse, PopulationResponse, ShapeResponse, ValidateBaselineResponse} from "../../generated";
import {BaselineMutation} from "./mutations";

export interface BaselineActions {
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

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    async uploadPJNZ({commit, dispatch, state}, formData) {
        commit({type: BaselineMutation.PJNZUpdated, payload: null});
        await api<BaselineMutation, BaselineMutation>(commit)
            .withSuccess(BaselineMutation.PJNZUpdated)
            .withError(BaselineMutation.PJNZUploadError)
            .freezeResponse()
            .postAndReturn<PjnzResponse>("/baseline/pjnz/", formData)
            .then(() => {
                if (!state.baselineError && state.iso3) {
                    dispatch('metadata/getPlottingMetadata', state.iso3, {root: true});
                }
                dispatch('validate');
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async uploadShape({commit, dispatch}, formData) {
        commit({type: BaselineMutation.ShapeUpdated, payload: null});
        await api<BaselineMutation, BaselineMutation>(commit)
            .withSuccess(BaselineMutation.ShapeUpdated)
            .withError(BaselineMutation.ShapeUploadError)
            .freezeResponse()
            .postAndReturn<ShapeResponse>("/baseline/shape/", formData)
            .then(() => {
                dispatch('validate');
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async uploadPopulation({commit, dispatch}, formData) {
        commit({type: BaselineMutation.PopulationUpdated, payload: null});
        await api<BaselineMutation, BaselineMutation>(commit)
            .withSuccess(BaselineMutation.PopulationUpdated)
            .withError(BaselineMutation.PopulationUploadError)
            .freezeResponse()
            .postAndReturn<PopulationResponse>("/baseline/population/", formData)
            .then(() => {
                dispatch('validate');
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async deletePJNZ({commit, dispatch}) {
        await api<BaselineMutation, BaselineMutation>(commit)
            .delete("/baseline/pjnz/")
            .then(() => {
                commit({type: BaselineMutation.PJNZUpdated, payload: null});
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async deleteShape({commit, dispatch}) {
        await api<BaselineMutation, BaselineMutation>(commit)
            .delete("/baseline/shape/")
            .then(() => {
                commit({type: BaselineMutation.ShapeUpdated, payload: null});
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async deletePopulation({commit, dispatch}) {
        await api<BaselineMutation, BaselineMutation>(commit)
            .delete("/baseline/population/")
            .then(() => {
                commit({type: BaselineMutation.PopulationUpdated, payload: null});
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async deleteAll(store) {
        await Promise.all([
            actions.deletePJNZ(store),
            actions.deleteShape(store),
            actions.deletePopulation(store)
        ]);
    },

    async getBaselineData({commit, dispatch}) {
        await Promise.all([
            api<BaselineMutation, BaselineMutation>(commit)
                .ignoreErrors()
                .withSuccess(BaselineMutation.PJNZUpdated)
                .freezeResponse()
                .get<PjnzResponse>("/baseline/pjnz/"),
            api<BaselineMutation, BaselineMutation>(commit)
                .ignoreErrors()
                .withSuccess(BaselineMutation.PopulationUpdated)
                .freezeResponse()
                .get<PjnzResponse>("/baseline/population/"),
            api<BaselineMutation, BaselineMutation>(commit)
                .ignoreErrors()
                .withSuccess(BaselineMutation.ShapeUpdated)
                .freezeResponse()
                .get<PjnzResponse>("/baseline/shape/")
        ]);

        await dispatch('validate');

        commit({type: "Ready", payload: true});
    },

    async validate({commit}) {
        commit({type: "Validating", payload: null});
        await api<BaselineMutation, BaselineMutation>(commit)
            .withSuccess(BaselineMutation.Validated)
            .withError(BaselineMutation.BaselineError)
            .freezeResponse()
            .get<ValidateBaselineResponse>("/baseline/validate/");
    }
};
