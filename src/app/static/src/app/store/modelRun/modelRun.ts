import {Module} from "vuex";
import {ReadyState, RootState, WarningsState} from "../../root";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {ModelResultResponse, ModelStatusResponse, Error} from "../../generated";

export interface ModelRunState extends ReadyState, WarningsState {
    modelRunId: string
    statusPollId: number,
    status: ModelStatusResponse
    errors: Error[],
    result: ModelResultResponse | null
    pollingCounter: number
}

export const maxPollErrors = 150;

export const initialModelRunState = (): ModelRunState => {
    return {
        modelRunId: "",
        errors: [],
        status: {} as ModelStatusResponse,
        statusPollId: -1,
        result: null,
        ready: false,
        pollingCounter : 0,
        warnings: []
    }
};

export const modelRunGetters = {
    complete: (state: ModelRunState) => {
        return !!state.status.success && state.errors.length == 0 && !!state.result
    },
    running: (state: ModelRunState) => {
        const started = !!state.status.id;
        const finished = state.status.done && (!state.status.success || !!state.result);
        return started && !finished
    }
};

const namespaced = true;

export const modelRun = (existingState: Partial<RootState> | null): Module<ModelRunState, RootState> => {
    return {
        namespaced,
        state: {...initialModelRunState(), ...existingState && existingState.modelRun, ready: false},
        actions,
        getters: modelRunGetters,
        mutations
    };
};
