import {RootMutation} from "../root/mutations";
import {ActionContext, ActionTree} from "vuex";
import {VersionsState} from "./versions";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {VersionsMutations} from "./mutations";
import qs from "qs";
import {Version} from "../../types";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>, name: string) => void,
    getVersions: (store: ActionContext<VersionsState, RootState>) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context, name) {
        const {commit} = context;
        commit({type: VersionsMutations.SetLoading, payload: true});
        await api<RootMutation, VersionsMutations>(context)
            .withSuccess(RootMutation.SetVersion, true)
            .withError(VersionsMutations.VersionError)
            .postAndReturn<String>("/version/", qs.stringify({name}));
    },
    async getVersions(context) {
        const {commit} = context;
        commit({type: VersionsMutations.SetLoading, payload: true});
        await api<VersionsMutations, VersionsMutations>(context)
            .withSuccess(VersionsMutations.SetPreviousVersions)
            .withError(VersionsMutations.VersionError)
            .get<Version[]>("/versions/");
    }
};
