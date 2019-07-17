import { Module } from 'vuex';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState} from "../../types";

export interface BaselineState {
    hasError: boolean
    country: string
}

export const baselineState: BaselineState = {
    country: "",
    hasError: false
};

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: baselineState,
    getters,
    actions,
    mutations
};
