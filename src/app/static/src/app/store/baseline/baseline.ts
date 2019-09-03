import { Module } from 'vuex';
import {actions} from './actions';
import { mutations } from './mutations';
import {StepState, RootState} from "../../main";
import {ShapeResponse} from "../../generated";

export interface BaselineState extends StepState {
    pjnzError: string
    country: string
    complete: boolean
    pjnzFilename: string
    shape: ShapeResponse | null
    shapeError: string
}

export const initialBaselineState: BaselineState = {
    country: "",
    pjnzError: "",
    pjnzFilename: "",
    complete: false,
    shape: null,
    shapeError: ""
};

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: initialBaselineState,
    getters: {},
    actions,
    mutations
};
