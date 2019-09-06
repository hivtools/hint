import {ActionContext, ActionTree} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {PjnzResponse} from "../../generated";

export type BaselineActionTypes = "PJNZUploaded" | "PJNZLoaded" | "ShapeUploaded" | "PopulationUploaded"
export type BaselineErrorActionTypes = "PJNZUploadError" | "ShapeUploadError" | "PopulationUploadError"

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void
    getBaselineData: (store: ActionContext<BaselineState, RootState>) => void
    uploadShape: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void,
    uploadPopulation: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    async uploadPJNZ({commit}, formData) {
        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .withSuccess("PJNZUploaded")
            .withError("PJNZUploadError")
            .postAndReturn<PjnzResponse>("/baseline/pjnz/", formData);
    },

    async uploadShape({commit}, formData) {
        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .withSuccess("ShapeUploaded")
            .withError("ShapeUploadError")
            .postAndReturn<PjnzResponse>("/baseline/shape/", formData);
    },

    async uploadPopulation({commit}, formData) {
        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .withSuccess("PopulationUploaded")
            .withError("PopulationUploadError")
            .postAndReturn<PjnzResponse>("/baseline/population/", formData);
    },

    async getBaselineData({commit}) {
        api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .ignoreErrors()
            .withSuccess("PJNZLoaded")
            .get<PjnzResponse>("/baseline/pjnz/");

        api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .ignoreErrors()
            .withSuccess("PopulationUploaded")
            .get<PjnzResponse>("/baseline/population/");

        return api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .ignoreErrors()
            .withSuccess("ShapeUploaded")
            .get<PjnzResponse>("/baseline/shape/");
    }
};
