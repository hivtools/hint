import {ActionContext, ActionTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelSubmitParameters, ModelSubmitResponse} from "../../generated";

export type ModelRunActionTypes = "ModelRunStarted"
export type ModelRunErrorTypes = "ModelRunError"

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>, modelRunParams: ModelSubmitParameters) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run({commit}, modelRunParams) {
        await api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
            .withSuccess("ModelRunStarted")
            .withError("ModelRunError")
            .postAndReturn<ModelSubmitResponse>("/model/run/", modelRunParams)
    }
};
