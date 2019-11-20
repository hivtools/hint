import {Module} from "vuex";
import {ReadyState, RootState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {localStorageManager} from "../../localStorageManager";
import {ModelResultResponse, ModelStatusResponse} from "../../generated";

export interface ModelRunState extends ReadyState {
    modelRunId: string
    statusPollId: number,
    status: ModelStatusResponse
    errors: any[],
    result: ModelResultResponse | null
}

export const initialModelRunState = (): ModelRunState => {
    return {
        modelRunId: "",
        errors: [],
        status: {} as ModelStatusResponse,
        statusPollId: -1,
        result: null,
        ready: false
    }
};

export const modelRunGetters = {
    complete: (state: ModelRunState) => {
        return !!state.status.success && state.errors.length == 0
    },
    running: (state: ModelRunState) => {
        return !!state.status.id && !state.status.done
    }
};

const namespaced: boolean = true;
const existingState = localStorageManager.getState();

export const modelRun: Module<ModelRunState, RootState> = {
    namespaced,
    state: {...initialModelRunState(), ...existingState && existingState.modelRun},
    actions,
    getters: modelRunGetters,
    mutations
};
