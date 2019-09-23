import {ActionContext, ActionTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelStatusResponse, ModelSubmitParameters, ModelSubmitResponse} from "../../generated";

export type ModelRunActionTypes = "ModelRunStarted" | "RunStatusUpdated" | "PollingForStatusStarted"
export type ModelRunErrorTypes = "ModelRunError" | "RunStatusError"

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>, modelRunParams: ModelSubmitParameters) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: number) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run({commit}, modelRunParams) {
        await api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
            .withSuccess("ModelRunStarted")
            .withError("ModelRunError")
            .postAndReturn<ModelSubmitResponse>("/model/run/", modelRunParams)
    },

    poll({commit, state}, runId) {

        const id = setInterval(() => {
            api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
                .withSuccess("RunStatusUpdated")
                .withError("RunStatusError")
                .get<ModelStatusResponse>(`/model/status/${runId}`);
        }, 2000);

        commit({type: "PollingForStatusStarted", payload: id})
    }
};
