import {ActionContext, ActionPayload, ActionTree} from 'vuex';
import axios from 'axios';
import {APIResponse, PJNZ, RootState, BaselineState} from "../../types";

export type BaselineActionTypes = "PJNZLoaded" | "PJNZUploadError"

export interface BaselinePayload extends ActionPayload {
    type: BaselineActionTypes
}

export interface PJNZLoaded extends BaselinePayload {
    payload: PJNZ
}

export interface BaselineActions {
    uploadPJNZ: (store: ActionContext<BaselineState, RootState>, file: File) => void
}

export const actions: ActionTree<BaselineState, RootState> & BaselineActions = {

    uploadPJNZ({commit}, file) {
        let formData = new FormData();
        formData.append('file', file);
        axios.post("/upload", formData)
            .then((response: APIResponse) => {
                const payload: PJNZ = response && response.data.data;
                commit<BaselinePayload>({type: "PJNZLoaded", payload});
            })
            .catch((e: {response: APIResponse}) => {
                const errors = e.response.data.errors;
                console.log(errors);
                commit<BaselinePayload>({type: 'PJNZUploadError', payload: errors});
            });
    }
};

