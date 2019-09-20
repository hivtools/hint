import {Module} from "vuex";
import {RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {BaselineState} from "../baseline/baseline";

export interface ModelRunState {
    modelRunId: string
    status: ModelRunStatus,
    statusPollId: number,
    success: boolean,
    errors: any[]
}

export enum ModelRunStatus {
    "NotStarted",
    "Started",
    "Complete"
}

export const initialModelRunState: ModelRunState = {
    modelRunId: "",
    statusPollId: -1,
    success: false,
    errors: [],
    status: ModelRunStatus.NotStarted
};

const namespaced: boolean = true;

export const modelRun: Module<ModelRunState, RootState> = {
    namespaced,
    state: initialModelRunState,
    actions,
    mutations
};
