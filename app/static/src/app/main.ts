import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import {baseline, BaselineState, initialBaselineState} from "./store/baseline/baseline";

export interface RootState {
    version: string;
    baseline: BaselineState
}

Vue.use(Vuex);

const storeOptions: StoreOptions<RootState> = {
    state: {
        version: '0.0.0',
        baseline: initialBaselineState
    },
    modules: {
        baseline
    }
};

export const store = new Vuex.Store<RootState>(storeOptions);
