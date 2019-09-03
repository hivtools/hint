import {ActionContext, ActionTree} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../main";
import {api} from "../../apiService";
import {PjnzResponse} from "../../generated";

export type BaselineActionTypes = "PJNZUploaded" | "PJNZLoaded"
export type BaselineErrorActionTypes = "PJNZUploadError"

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, formData: FormData) => void
    getBaselineData: (store: ActionContext<BaselineState, RootState>) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    async uploadPJNZ({commit}, formData) {
        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .withSuccess("PJNZUploaded")
            .withError("PJNZUploadError")
            .postAndReturn<PjnzResponse>("/baseline/pjnz/", formData);
    },

    async getBaselineData({commit}) {
        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .ignoreErrors()
            .withSuccess("PJNZLoaded")
            .get<PjnzResponse>("/baseline/pjnz/");
    }

};

