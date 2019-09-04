import { Module } from 'vuex';
import {actions} from './actions';
import { mutations } from './mutations';
import {RootState} from "../../main";
import {ShapeResponse} from "../../generated";


export interface BaselineState {
    pjnzError: string
    country: string
    pjnzFilename: string
    shape: ShapeResponse | null
    shapeError: string
}

export const initialBaselineState: BaselineState = {
    country: "",
    pjnzError: "",
    pjnzFilename: "",
    shape: null,
    shapeError: ""
};

export const baselineGetters = {
  complete: (state: BaselineState) => {
      return !!state.country && !!state.shape
  }
};

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: initialBaselineState,
    getters: baselineGetters,
    actions,
    mutations
};
