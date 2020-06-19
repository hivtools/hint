import {ActionContext, ActionTree} from "vuex";
import {initialVersionsState, VersionsState} from "../versions/versions";
import {emptyState, RootState} from "../../root";
import {api} from "../../apiService";
import {VersionsMutations} from "./mutations";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context) {
        const {commit, dispatch, state} = context;
        await api<VersionsMutations, VersionsMutations>(context)
            .withSuccess(VersionsMutations.NewVersion)
            .withError(VersionsMutations.VersionError)
            .postAndReturn<String>("/version/")
            .then(() => {
                if (!state.error) {
                    //TODO: Still have a weird login loading artefact on first login
                    //commit("load/UpdatingState");
                    //Reset state for the new version
                    const newRootState = {
                        ...emptyState(),
                        versions: {
                            ...initialVersionsState,
                            userVersion: state.userVersion
                        }
                    };
                    dispatch("load/updateStoreState", newRootState, {root: true});
                }
            });
    }
};
