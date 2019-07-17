import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {BaselineState, RootState} from "../../types";

export const initialBaselineState: BaselineState = {
    country: "",
    hasError: false,
    complete: false
};

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: initialBaselineState,
    getters: {},
    actions,
    mutations
};
