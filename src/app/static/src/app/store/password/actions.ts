import {ActionContext, ActionTree} from "vuex";
import {PasswordState} from "password";
import {RootState} from "../../main";
import {api} from "../../apiService";
import {BaselineData, BaselinePayload, PJNZ} from "../baseline/actions";

export interface PasswordActions {
    requestResetLink (store: ActionContext<PasswordState>, email: string) => void
}

export const actions: ActionTree<PasswordState> & PasswordActions = {

    reqiestResetLink({commit}, string) {
        let formData = new FormData();
        formData.append('file', file);
        api.postAndReturn<PJNZ>("/baseline/pjnz/", formData)
            .then((payload) => {
                commit<BaselinePayload>({type: "PJNZUploaded", payload});
            })
            .catch((error: Error) => {
                commit<BaselinePayload>({type: 'PJNZUploadError', payload: error.message});
            });
    }
};