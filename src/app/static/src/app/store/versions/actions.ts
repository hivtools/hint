import {RootMutation} from "../root/mutations";
import {ActionContext, ActionTree} from "vuex";
import {VersionsState} from "./versions";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {VersionsMutations} from "./mutations";
import qs from "qs";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>, name: string) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context, name) {
        const {commit} = context;
        commit({type: VersionsMutations.SetLoading, payload: true});
        await api<RootMutation, VersionsMutations>(context)
            .withSuccess(RootMutation.SetVersion, true)
            .withError(VersionsMutations.VersionError)
            .postAndReturn<String>("/version/", qs.stringify({name}));
    }
};
