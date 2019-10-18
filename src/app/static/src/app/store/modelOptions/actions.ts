import {ActionContext, ActionTree} from "vuex";
import {ModelOptionsState} from "./modelOptions";
import {RootState} from "../../root";
import {ValidationResult} from "../../components/forms/types";

export interface ModelOptionsActions {
    save: (store: ActionContext<ModelOptionsState, RootState>, payload: ValidationResult) => void
}

export const actions: ActionTree<ModelOptionsState, RootState> & ModelOptionsActions = {
    save({commit}, payload: ValidationResult) {
        commit({type: "ModelOptionsSaved", payload});
    }
};
