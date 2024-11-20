import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState, WarningsState} from "../../root";
import {ReviewInputDataset} from "../../types";
import {Error, InputComparisonResponse} from "../../generated";

export interface ReviewInputState extends WarningsState {
    datasets: Record<string, ReviewInputDataset>
    error: Error | null,
    loading: boolean,
    inputComparison: {
        loading: boolean,
        error: Error | null,
        data: InputComparisonResponse | null
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
        }
    }
};

const namespaced = true;

export const reviewInput: Module<ReviewInputState, RootState> = {
    namespaced,
    state: {...initialReviewInputState()},
    actions,
    mutations,
};
