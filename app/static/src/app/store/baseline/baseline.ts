import { Module } from 'vuex';
import {actions} from './actions';
import { mutations } from './mutations';
import {StepState, RootState} from "../../main";

export interface BaselineState extends StepState {
    pjnzError: string
    country: string
    complete: boolean,
    pjnzFilename: string
}

export const initialBaselineState: BaselineState = {
    country: "",
    pjnzError: "",
    pjnzFilename: "",
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
