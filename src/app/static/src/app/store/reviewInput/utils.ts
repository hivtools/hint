import {Commit} from "vuex";
import {RootState} from "../../root";
import {getSinglePopulationChartDataset} from "../plotSelections/getters";
import {ReviewInputMutation} from "./mutations";

export const commitCountryLevelPopulationData = async (commit: Commit, rootState: RootState, rootGetters: any) => {
    const ageGroups = rootGetters["reviewInput/ageGroupOptions"];
    if (rootState.baseline.population) {
        const countryData = getSinglePopulationChartDataset({
            indicators: rootState.baseline.population.data,
            ageGroups,
            isOutline: true,
            isProportion: true
        });
        commit({type: ReviewInputMutation.SetPopulationCountryLevel, payload: countryData});
    }
}
