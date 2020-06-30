import {RootMutation} from "../root/mutations";
import {ActionContext, ActionTree} from "vuex";
import {VersionsState} from "./versions";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {VersionsMutations} from "./mutations";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>, name: string) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context, name) {
        const {commit, state }= context;
        commit({type: VersionsMutations.SetLoading, payload: true});
        await api<VersionsMutations, VersionsMutations>(context)
            .withError(VersionsMutations.VersionError)
            .postAndReturn<String>("/version/", {name})
            .then((response: any) => {
                if (!state.error) {
                    commit({type: RootMutation.ResetVersion, payload: response.data}, { root: true });
                }
            });
    }
};
