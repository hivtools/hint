import {ActionContext, ActionTree} from "vuex";
import {VersionsState} from "../versions/versions";
import {RootState} from "../../root";

export interface VersionsActions {
    createVersion: (store: ActionContext<VersionsState, RootState>) => void
}

export const actions: ActionTree<VersionsState, RootState> & VersionsActions = {
    async createVersion(context) {
        alert("creating new version")
    }
};