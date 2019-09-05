import { Module } from 'vuex';
import {actions} from './actions';
import { mutations } from './mutations';
import {RootState} from "../../root";

export interface BaselineState {
    pjnzError: string
    country: string
    pjnzFilename: string
}

export const initialBaselineState: BaselineState = {
    country: "",
    pjnzError: "",
    pjnzFilename: ""
};

export const baselineGetters = {
  complete: (state: BaselineState) => {
      return !!state.country
  }
};

const getters = baselineGetters

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: initialBaselineState,
    getters,
    actions,
    mutations
};
