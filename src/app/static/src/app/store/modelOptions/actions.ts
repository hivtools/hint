import {ModelOptionsState} from "./modelOptions";
import {ActionContext, ActionTree} from "vuex";
import {DynamicFormMeta} from "../../components/forms/types";
import {api} from "../../apiService";
import {RootState} from "../../root";

interface ModelOptionsActions {
    fetchModelRunOptions: (store: ActionContext<ModelOptionsState, RootState>) => void
}

export const actions: ActionTree<ModelOptionsState, RootState> & ModelOptionsActions = {

    async fetchModelRunOptions({commit}) {
        commit("FetchingModelOptions");
        await api(commit)
            .withSuccess("ModelOptionsFetched")
            .get<DynamicFormMeta>("/model/options/");
    }
};
