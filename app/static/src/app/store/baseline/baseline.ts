import { Module } from 'vuex';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';
import {BaselineState, RootState} from "../../types";

export const baselineState: BaselineState = {
    country: "",
    hasError: false,
    complete: false
};

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: baselineState,
    getters,
    actions,
    mutations
};
