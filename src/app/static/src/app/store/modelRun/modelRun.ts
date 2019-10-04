import {Module} from "vuex";
import {RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {ModelResultResponse} from "../../generated";

export interface ModelRunState {
    modelRunId: string
    status: ModelRunStatus,
    statusPollId: number,
    success: boolean,
    errors: any[],
    result: ModelResultResponse | null
}

export enum ModelRunStatus {
    "NotStarted",
    "Started",
    "Complete"
}

export const localStorageKey = "modelRun";

export const initialModelRunState: ModelRunState = {
    modelRunId: "",
    success: false,
    errors: [],
    status: ModelRunStatus.NotStarted,
    statusPollId: -1,
    result: null
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const modelRun: Module<ModelRunState, RootState> = {
    namespaced,
    state: {...initialModelRunState, ...existingState && existingState.modelRun},
    actions,
    mutations
};
