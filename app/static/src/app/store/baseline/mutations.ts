import { MutationTree } from 'vuex';
import {BaselineState} from "./baseline";
import {PJNZLoaded} from "./actions";

export const mutations: MutationTree<BaselineState> = {
    PJNZLoaded(state: BaselineState, action: PJNZLoaded) {
        state.hasError = false;
        state.country = action.payload.country
    },
    PJNZUploadError(state) {
        state.hasError = true;
    }
};
