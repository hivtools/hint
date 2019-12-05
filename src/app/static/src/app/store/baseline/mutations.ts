import {MutationTree} from 'vuex';
import {BaselineState} from "./baseline";
import {
    NestedFilterOption,
    PjnzResponse,
    PopulationResponse,
    ShapeResponse,
    ValidateBaselineResponse,
    Error
} from "../../generated";
import {PayloadWithType} from "../../types";
import {flattenOptions} from "../filteredData/utils";
import {ReadyState} from "../../root";

export enum BaselineMutation {
    PJNZUpdated = "PJNZUpdated",
    PJNZUploadError = "PJNZUploadError",
    ShapeUpdated = "ShapeUpdated",
    ShapeUploadError = "ShapeUploadError",
    PopulationUpdated = "PopulationUpdated",
    PopulationUploadError = "PopulationUploadError",
    Ready = "Ready",
    Validating = "Validating",
    Validated = "Validated",
    BaselineError = "Error"
}

export const BaselineUpdates = [
    BaselineMutation.PJNZUpdated,
    BaselineMutation.ShapeUpdated,
    BaselineMutation.PopulationUpdated
];

export const mutations: MutationTree<BaselineState> = {

    [BaselineMutation.PJNZUploadError](state: BaselineState, action: PayloadWithType<Error>) {
        state.pjnzError = action.payload;
    },

    [BaselineMutation.PJNZUpdated](state: BaselineState, action: PayloadWithType<PjnzResponse | null>) {
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
        state.pjnzError = null;
    },

    [BaselineMutation.ShapeUpdated](state: BaselineState, action: PayloadWithType<ShapeResponse>) {
        state.shape = Object.freeze(action.payload);
        if (action.payload && action.payload.filters.regions) {
            state.regionFilters = action.payload.filters.regions.children as NestedFilterOption[];
            state.flattenedRegionFilters = Object.freeze(flattenOptions(state.regionFilters));
        }
        state.shapeError = null;
    },

    [BaselineMutation.ShapeUploadError](state: BaselineState, action: PayloadWithType<Error>) {
        state.shapeError = action.payload;
    },

    [BaselineMutation.PopulationUpdated](state: BaselineState, action: PayloadWithType<PopulationResponse>) {
        state.population = action.payload;
        state.populationError = null;
    },

    [BaselineMutation.PopulationUploadError](state: BaselineState, action: PayloadWithType<Error>) {
        state.populationError = action.payload;
    },

    [BaselineMutation.Validating](state: BaselineState) {
        state.validating = true;
        state.validatedConsistent = false;
        state.baselineError = null;
    },

    [BaselineMutation.Validated](state: BaselineState, action: PayloadWithType<ValidateBaselineResponse>) {
        state.validating = false;

        state.validatedConsistent = action.payload.consistent;
        state.baselineError = null;
    },

    [BaselineMutation.BaselineError](state: BaselineState, action: PayloadWithType<Error>) {
        state.validating = false;
        state.validatedConsistent = false;
        state.baselineError = action.payload;
    },

    [BaselineMutation.Ready](state: ReadyState) {
        state.ready = true;
    }
};
