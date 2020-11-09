import {ModelOptionsState} from "./modelOptions";
import {ActionContext, ActionTree, Payload} from "vuex";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {api} from "../../apiService";
import {RootState} from "../../root";
import {ModelOptionsMutation} from "./mutations";
import { ModelOptionsValidate } from "../../generated";

export interface ModelOptionsActions {
    fetchModelRunOptions: (store: ActionContext<ModelOptionsState, RootState>) => void
    validateModelOptions: (store: ActionContext<ModelOptionsState, RootState>, payload: DynamicFormData) => void
}

export const actions: ActionTree<ModelOptionsState, RootState> & ModelOptionsActions = {

    async fetchModelRunOptions(context) {
        const {commit} = context;
        commit(ModelOptionsMutation.FetchingModelOptions);
        const response = await api<ModelOptionsMutation, ModelOptionsMutation>(context)
            .withSuccess(ModelOptionsMutation.ModelOptionsFetched)
            .ignoreErrors()
            .get<DynamicFormMeta>("/model/options/");

        if (response) {
            commit({type: ModelOptionsMutation.SetModelOptionsVersion, payload: response.version});
        }
    },

    async validateModelOptions(context, payload) {
        const {commit, rootState} = context;
        commit(ModelOptionsMutation.LoadUpdatedOptions, payload);
        const options = rootState.modelOptions.options;
        const version = rootState.modelOptions.version;
        await api<ModelOptionsMutation, ModelOptionsMutation>(context)
            .withSuccess(ModelOptionsMutation.Validate)
            .withError(ModelOptionsMutation.HasValidationError)
            .postAndReturn<ModelOptionsValidate>("/model/validate/options/", {options, version})

    }
};
