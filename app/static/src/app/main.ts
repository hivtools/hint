import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import {RootState} from "./types";
import {baseline, initialBaselineState} from "./store/baseline/baseline";

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
