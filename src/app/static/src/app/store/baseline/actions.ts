import {ActionContext, ActionTree, Payload} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../main";
import {api} from "../../apiService";
import {BaselineData} from "../../types";
import {PjnzResponse} from "../../generated";

export type BaselineActionTypes = "PJNZUploaded" | "BaselineDataLoaded"
export type BaselineErrorActionTypes = "PJNZUploadError"

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, file: File) => void
    getBaselineData: (store: ActionContext<BaselineState, RootState>) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    async uploadPJNZ({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);

        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .withSuccess("PJNZUploaded")
            .withError("PJNZUploadError")
            .postAndReturn<PjnzResponse>("/baseline/pjnz/", formData);
    },

    async getBaselineData({commit}) {
        await api<BaselineActionTypes, BaselineErrorActionTypes>(commit)
            .ignoreErrors()
            .withSuccess("BaselineDataLoaded")
            .get<BaselineData>("/baseline/");
    }

};

