import { Module } from 'vuex';
import { actions } from './actions';
import { mutations } from './mutations';
import {RootState} from "../../main";

export interface BaselineState {
    hasError: boolean
    country: string
    complete: boolean
}

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
