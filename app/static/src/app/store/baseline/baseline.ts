import { Module } from 'vuex';
import {actions, PJNZ} from './actions';
import { mutations } from './mutations';
import {RootState} from "../../main";

export interface BaselineState {
    pjnzError: string
    country: string
    complete: boolean,
    pjnzFileName: string
}

export const initialBaselineState: BaselineState = {
    country: "",
    pjnzError: "",
    pjnzFileName: "",
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
