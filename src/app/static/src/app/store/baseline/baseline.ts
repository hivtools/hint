import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {ReadyState, RootState} from "../../root";
import {PjnzResponse, PopulationResponse, ShapeResponse} from "../../generated";

export interface BaselineState extends ReadyState {
    pjnzError: string
    country: string
    pjnz: PjnzResponse | null
    shape: ShapeResponse | null
    shapeError: string
    population: PopulationResponse | null,
    populationError: string
}

export const initialBaselineState: BaselineState = {
    country: "",
    pjnzError: "",
    pjnz: null,
    shape: null,
    shapeError: "",
    population: null,
    populationError: "",
    ready: false
};

export const baselineGetters = {
  complete: (state: BaselineState) => {
      return !!state.country && !!state.shape && !!state.population
  }
};

const getters = baselineGetters;

const namespaced: boolean = true;

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: {...initialBaselineState},
    getters,
    actions,
    mutations
};
