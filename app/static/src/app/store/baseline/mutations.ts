import { MutationTree } from 'vuex';
import {BaselineState} from "../../types";
import {PJNZLoaded} from "./actions";

export const mutations: MutationTree<BaselineState> = {
    PJNZLoaded(state: BaselineState, action: PJNZLoaded) {
        state.hasError = false;
        state.country = action.payload.country
    },
    PJNZUploadError(state: BaselineState) {
        state.hasError = true;
    }
};
