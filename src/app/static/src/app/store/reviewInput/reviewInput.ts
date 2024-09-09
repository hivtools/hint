import {Module} from "vuex";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState, WarningsState} from "../../root";
import {ReviewInputDataset} from "../../types";
import {Error} from "../../generated";

export interface ReviewInputState extends WarningsState {
    datasets: Record<string, ReviewInputDataset>
    error: Error | null,
    loading: boolean
}

export const initialReviewInputState = (): ReviewInputState => {
    return {
        datasets: {},
        error: null,
        warnings: [],
        loading: false
    }
};

const namespaced = true;

export const reviewInput: Module<ReviewInputState, RootState> = {
    namespaced,
    state: {...initialReviewInputState()},
    actions,
    mutations,
};
