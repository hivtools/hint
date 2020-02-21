import {ChoroplethIndicatorMetadata} from "../../app/generated";
import {RootState} from "../../app/root";
import {getters} from "../../app/store/surveyAndProgramData/getters";

export function testIndicatorMetadata(indicator: string,
                                      value_column: string,
                                      indicator_column: string,
                                      indicator_value: string,
                                      min: number = 0,
                                      max: number = 1): ChoroplethIndicatorMetadata {
    return {
        name: indicator,
        indicator: indicator,
        value_column: value_column,
        indicator_column: indicator_column,
        indicator_value: indicator_value,
        colour: "interpolateGreys",
        invert_scale: false,
        min,
        max
    };
}

export function getGetters(rootState: RootState) {
    return {excludeRow: getters.excludeRow(rootState.filteredData)};
}

export function getResult(rootState: RootState, testMeta: ChoroplethIndicatorMetadata) {
    const testRootGetters = {
        "metadata/choroplethIndicatorsMetadata": [testMeta]
    };
    const testGetters = getGetters(rootState);
    return getters.regionIndicators(rootState.filteredData,
        testGetters,
        rootState,
        testRootGetters);
}
