import {ModelOptionsState} from "./modelOptions";
import {ActionContext, ActionTree} from "vuex";
import {DynamicFormMeta} from "../../components/forms/types";
import {api, ResponseWithType} from "../../apiService";
import {RootState} from "../../root";
import {ModelOptionsMutation} from "./mutations";

export interface ModelOptionsActions {
    fetchModelRunOptions: (store: ActionContext<ModelOptionsState, RootState>) => void
}

export const actions: ActionTree<ModelOptionsState, RootState> & ModelOptionsActions = {

    async fetchModelRunOptions(context) {
        const {commit} = context;
        commit(ModelOptionsMutation.FetchingModelOptions);
        const response = await api<ModelOptionsMutation, ModelOptionsMutation>(context)
            .withSuccess(ModelOptionsMutation.ModelOptionsFetched)
            .get<DynamicFormMeta>("/model/options/");

        if (response) {
            commit({type: ModelOptionsMutation.SetModelOptionsVersion, payload: response.version});
        }
    }
};
