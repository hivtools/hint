import {Module} from "vuex";
import {RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface ModelRunState {
    modelRunId: string
    status: ModelRunStatus,
    statusPollId: number
}

export type ModelRunStatus = "NotStarted" | "Started" | "Complete"

export const initialModelRunState : ModelRunState = {
    modelRunId: "",
    status: "NotStarted",
    statusPollId: -1
};

const namespaced: boolean = true;

export const modelRun: Module<ModelRunState, RootState> = {
    namespaced,
    state: initialModelRunState,
    actions,
    mutations
};
