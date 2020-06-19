import {ActionContext, ActionTree} from "vuex";
import {VersionsState} from "../versions/versions";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelOptionsMutation} from "../modelOptions/mutations";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context) {
        const response = await api<ModelOptionsMutation, ModelOptionsMutation>(context)
            .withSuccess(ModelOptionsMutation.ModelOptionsFetched)
            .postAndReturn<String>("/version/");
    }
};
