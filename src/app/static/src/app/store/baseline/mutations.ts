import {Mutation, MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {
    NestedFilterOption,
    PjnzResponse,
    PopulationResponse,
    ShapeResponse,
    ValidateBaselineResponse
} from "../../generated";
import {PayloadWithType} from "../../types";
import {readyStateMutations} from "../shared/readyStateMutations";
import {flattenOptions} from "../filteredData/utils";

type BaselineMutation = Mutation<BaselineState>

export interface BaselineMutations {
    PJNZUpdated: BaselineMutation
    PJNZUploadError: BaselineMutation
    ShapeUpdated: BaselineMutation
    ShapeUploadError: BaselineMutation
    PopulationUpdated: BaselineMutation
    PopulationUploadError: BaselineMutation
    Ready: BaselineMutation,
    Validating: BaselineMutation,
    Validated: BaselineMutation,
    BaselineError: BaselineMutation
}

export const mutations: MutationTree<BaselineState> & BaselineMutations = {

    PJNZUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.pjnzError = action.payload;
    },

    PJNZUpdated(state: BaselineState, action: PayloadWithType<PjnzResponse | null>) {
        const data = action.payload;
        if (data) {
            state.country = data.data.country;
            state.iso3 = data.data.iso3;
            state.pjnz = data;
        } else {
            state.country = "";
            state.iso3 = "";
            state.pjnz = null;
        }
        state.pjnzError = "";
    },

    ShapeUpdated(state: BaselineState, action: PayloadWithType<ShapeResponse>) {
        state.shape = Object.freeze(action.payload);
        if (action.payload && action.payload.filters.regions){
            state.regionFilters = action.payload.filters.regions.children as NestedFilterOption[];
            state.flattenedRegionFilters = Object.freeze(flattenOptions(state.regionFilters));
        }
        state.shapeError = "";
    },

    ShapeUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.shapeError = action.payload;
    },

    PopulationUpdated(state: BaselineState, action: PayloadWithType<PopulationResponse>) {
        state.population = action.payload;
        state.populationError = "";
    },

    PopulationUploadError(state: BaselineState, action: PayloadWithType<string>) {
        state.populationError = action.payload;
    },

    Validating(state: BaselineState){
        state.validating = true;
        state.validatedConsistent = false;
        state.baselineError = "";
    },

    Validated(state: BaselineState, action: PayloadWithType<ValidateBaselineResponse>) {
        state.validating = false;

        state.validatedConsistent = action.payload.consistent;
        state.baselineError = "";
    },

    BaselineError(state: BaselineState, action: PayloadWithType<string>) {
        state.validating = false;
        state.validatedConsistent = false;
        state.baselineError = action.payload;
    },

    ...readyStateMutations
};
