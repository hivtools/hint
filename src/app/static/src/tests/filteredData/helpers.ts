import {ChoroplethIndicatorMetadata} from "../../app/generated";
import {RootState} from "../../app/root";
import {getters} from "../../app/store/filteredData/getters";

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
    return {excludeRow: () => getters.excludeRow(rootState.filteredData)};
}
