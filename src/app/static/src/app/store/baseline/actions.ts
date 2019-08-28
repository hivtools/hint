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

    uploadPJNZ({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        api.postAndReturn<PjnzResponse>("/baseline/pjnz/", formData)
            .then((payload) => {
                commit<BaselinePayload<PjnzResponse>>({type: "PJNZUploaded", payload});
            })
            .catch((error: Error) => {
                commit<BaselinePayload<String>>({type: 'PJNZUploadError', payload: error.message});
            });
    },

    getBaselineData({commit}) {
        api.get<BaselineData>("/baseline/")
            .then((payload) => {
                commit<BaselinePayload<BaselineData>>({type: "BaselineDataLoaded", payload});
            })
            .catch(api.doNothing);
    }
};

