import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormMeta} from "../../components/forms/types";

export type ModelOptionsActionTypes = "ModelOptionsFetched"
export type ModelOptionsErrorTypes = "ModelOptionsError"

export interface ModelOptionsActions {
    getOptions: (store: ActionContext<ModelOptionsState, RootState>) => void
}

export const actions: ActionTree<ModelOptionsState, RootState> & ModelOptionsActions = {

    async getOptions({commit}) {
        await api<ModelOptionsActionTypes, ModelOptionsErrorTypes>(commit)
            .withSuccess("ModelOptionsFetched")
            .withError("ModelOptionsError")
            .get<DynamicFormMeta>("/model/options/")
    }

};
