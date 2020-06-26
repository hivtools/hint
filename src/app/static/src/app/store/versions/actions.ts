import {ActionContext, ActionTree} from "vuex";
import {initialVersionsState, VersionsState} from "../versions/versions";
import {emptyState, RootState} from "../../root";
import {api} from "../../apiService";
import {VersionsMutations} from "./mutations";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>, name: string) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context, name) {
        const {commit, dispatch, state} = context;
        commit({type: VersionsMutations.SetLoading, payload: true});
        await api<VersionsMutations, VersionsMutations>(context)
            .withSuccess(VersionsMutations.NewVersion)
            .withError(VersionsMutations.VersionError)
            .postAndReturn<String>("/version/", {name})
            .then(() => {
                if (!state.error) {
                    // Reset state for new version
                    const newRootState = {
                        ...emptyState(),
                        versions: {
                            ...initialVersionsState,
                            currentVersion: state.currentVersion,
                            currentSnapshot: state.currentVersion!.snapshots[0]
                        }
                    };
                    dispatch("load/updateStoreState", newRootState, {root: true});
                }
            });
    }
};
