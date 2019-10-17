import {ActionContext, ActionTree} from "vuex";
import {ModelOptionsState} from "./modelOptions";
import {RootState} from "../../root";

export type ModelRunActionTypes = "ModelOptionsValidated"

export interface ModelOptionsActions {
    validated: (store: ActionContext<ModelOptionsState, RootState>) => void
}

export const actions: ActionTree<ModelOptionsState, RootState> & ModelOptionsActions = {
    validated({commit}) {
        commit({type: "ModelOptionsValidated", payload: true});
    }
};
