import {ReadyState} from "../../root";

export const readyStateMutations = {
    Ready(state: ReadyState) {
        state.ready = true;
    }
};
