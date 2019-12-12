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

    async uploadPJNZ(context, formData) {
        const {commit, dispatch, state} = context;
        commit({type: BaselineMutation.PJNZUpdated, payload: null});
        await api<BaselineMutation, BaselineMutation>(context)
            .withSuccess(BaselineMutation.PJNZUpdated)
            .withError(BaselineMutation.PJNZUploadError)
            .freezeResponse()
            .postAndReturn<PjnzResponse>("/baseline/pjnz/", formData)
            .then((response) => {
                if (response) {
                    dispatch('metadata/getPlottingMetadata', state.iso3, {root: true});
                    dispatch('validate');
                }
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async uploadShape(context, formData) {
        const {commit, dispatch} = context;
        commit({type: BaselineMutation.ShapeUpdated, payload: null});
        await api<BaselineMutation, BaselineMutation>(context)
            .withSuccess(BaselineMutation.ShapeUpdated)
            .withError(BaselineMutation.ShapeUploadError)
            .freezeResponse()
            .postAndReturn<ShapeResponse>("/baseline/shape/", formData)
            .then((response) => {
                if (response) {
                    dispatch('validate');
                }
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
    },

    async uploadPopulation(context, formData) {
        const {commit, dispatch} = context;
        commit({type: BaselineMutation.PopulationUpdated, payload: null});
        await api<BaselineMutation, BaselineMutation>(context)
            .withSuccess(BaselineMutation.PopulationUpdated)
            .withError(BaselineMutation.PopulationUploadError)
            .freezeResponse()
            .postAndReturn<PopulationResponse>("/baseline/population/", formData)
            .then((response) => {
                if (response) {
                    dispatch('validate');
                }
                dispatch("surveyAndProgram/deleteAll", {}, {root: true});
            });
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
