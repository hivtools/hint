import {ActionContext, ActionTree, Payload} from 'vuex';
import {BaselineState} from "./baseline";
import {RootState} from "../../main";
import {api} from "../../apiService";
import {PjnzResponse} from "../../generated";
import {BaselineData} from "../../types";

export type BaselineActionTypes = "PJNZUploaded" | "PJNZUploadError" | "BaselineDataLoaded"

export interface BaselinePayload<T> extends Payload {
    type: BaselineActionTypes
    payload: T
}

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, file: File) => void
    getBaselineData: (store: ActionContext<BaselineState, RootState>) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    async uploadPJNZ({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);

        await this._uploadPJNZ(commit, formData)
    },

    async _uploadPJNZ(commit, formData) {
        const payload = await api()
            .commitFirstError(commit, "PJNZUploadError")
            .postAndReturn<PjnzResponse>("/baseline/pjnz/", formData);

        payload && commit<BaselinePayload<PjnzResponse>>({type: "PJNZUploaded", payload});
    },

    async getBaselineData({commit}) {

        const payload = await api()
            .ignoreErrors()
            .get<BaselineData>("/baseline/");

        payload && commit<BaselinePayload<BaselineData>>({type: "BaselineDataLoaded", payload});
    }
};

