import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState, WarningsState} from "../../root";
import {ReviewInputDataset} from "../../types";
import {
    Error,
    FilterOption,
    InputComparisonResponse,
    InputPopulationMetadataResponse
} from "../../generated";
import {PopulationChartDataset} from "../plotSelections/plotSelections";

export interface ReviewInputState extends WarningsState {
    datasets: Record<string, ReviewInputDataset>
    error: Error | null,
    loading: boolean,
    inputComparison: {
        loading: boolean,
        error: Error | null,
        data: InputComparisonResponse | null
    },
    population: {
        loading: boolean,
        error: Error | null,
        data: InputPopulationMetadataResponse | null,
        countryLevelData: PopulationChartDataset[]
    }
}

export const initialReviewInputState = (): ReviewInputState => {
    return {
        datasets: {},
        error: null,
        warnings: [],
        loading: false,
        inputComparison: {
            loading: false,
            error: null,
            data: null
        },
        population: {
            loading: false,
            error: null,
            data: null,
            countryLevelData: [],
        }
    }
};

export const reviewInputGetters = {
    ageGroupOptions: (state: ReviewInputState): FilterOption[] => {
        const options = state.population?.data?.filterTypes.find(f=>f.id==='age')?.options;
        if (!options) {
            return []
        }
        return [...options].reverse();
    },
};

const getters = reviewInputGetters;

const namespaced = true;

export const reviewInput: Module<ReviewInputState, RootState> = {
    namespaced,
    state: {...initialReviewInputState()},
    actions,
    mutations,
    getters
};
