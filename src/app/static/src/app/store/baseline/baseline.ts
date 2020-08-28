import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {ReadyState, RootState} from "../../root";
import {NestedFilterOption, PjnzResponse, PopulationResponse, ShapeResponse, Error} from "../../generated";
import {Dataset, Dict} from "../../types";
import {localStorageManager} from "../../localStorageManager";

export interface BaselineState extends ReadyState {
    selectedDataset: Dataset | null
    pjnzError: Error | null
    country: string
    iso3: string
    pjnz: PjnzResponse | null
    shape: ShapeResponse | null
    regionFilters: NestedFilterOption[]
    flattenedRegionFilters: Dict<NestedFilterOption>
    shapeError: Error | null
    population: PopulationResponse | null,
    populationError: Error | null,
    validating: boolean,
    validatedConsistent: boolean,
    baselineError: Error | null
}

export const initialBaselineState = (): BaselineState => {
    return {
        selectedDataset: null,
        country: "",
        iso3: "",
        pjnzError: null,
        pjnz: null,
        shape: null,
        regionFilters: [],
        flattenedRegionFilters: {},
        shapeError: null,
        population: null,
        populationError: null,
        ready: false,
        validating: false,
        validatedConsistent: false,
        baselineError: null
    }
};

export const baselineGetters = {
    complete: (state: BaselineState) => {
        return state.validatedConsistent &&
            !!state.country && !!state.iso3 && !!state.shape && !!state.population
    }
};

const getters = baselineGetters;

const namespaced: boolean = true;

const existingState = localStorageManager.getState();

export const baseline: Module<BaselineState, RootState> = {
    namespaced,
    state: {...initialBaselineState(), ...existingState && existingState.baseline},
    getters,
    actions,
    mutations
};
