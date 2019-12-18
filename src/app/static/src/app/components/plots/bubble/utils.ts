import {BubbleIndicatorValuesDict, Dict, Filter, IndicatorValuesDict, NumericRange} from "../../../types";
import {getColor} from "../../../store/filteredData/utils";
import {Feature} from "geojson";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../../generated";
import Choropleth from "../Choropleth.vue";

export const toIndicatorNameLookup = (array: ChoroplethIndicatorMetadata[]) =>
    array.reduce((obj, current) => {
        obj[current.indicator] = current.name;
        return obj
    }, {} as Dict<string>);

const iterateDataValues = function(
    data: any,
    indicatorsMeta: ChoroplethIndicatorMetadata[],
    selectedAreaIds: string[] | null,
    filters: Filter[] | null,
    selectedFilterValues: Dict<FilterOption[]> | null,
    func: (areaId: string,
           indicatorMeta: ChoroplethIndicatorMetadata, value: number) => void) {

    for (const row of data) {
        if (filters && selectedFilterValues && excludeRow(row, filters, selectedFilterValues)) {
            continue;
        }

        const areaId: string = row.area_id;

        if (selectedAreaIds && !selectedAreaIds.includes(areaId)) {
            continue;
        }

        for (const metadata of indicatorsMeta) {

            if (metadata.indicator_column && metadata.indicator_value != row[metadata.indicator_column]) {
                //This data is in long format, and the indicator column's value does not match that for this indicator
                continue;
            }

            if (!row[metadata.value_column]) {
                //No value for this indicator in this row
                continue;
            }

            const value = row[metadata.value_column];

            func(areaId, metadata, value);
        }
    }
};

const excludeRow = function(row: any, filters: Filter[], selectedFilterValues: Dict<FilterOption[]>){
    let excludeRow = false;
    for (const filter of filters) {
        const filterValues = selectedFilterValues[filter.id].map(n => n.id);
        if (filterValues.indexOf(row[filter.column_id].toString()) < 0) {
            excludeRow = true;
            break;
        }
    }
    return excludeRow;
};

export const getIndicatorRanges = function(data: any,
                                           indicatorsMeta: ChoroplethIndicatorMetadata[]): Dict<NumericRange>{
    const result = {} as Dict<NumericRange>;
    iterateDataValues(data, indicatorsMeta, null, null, null,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
            const indicator = indicatorMeta.indicator;
            if (!result[indicator]) {
                result[indicator] = {min: value, max: value};
            } else {
                result[indicator].min = Math.min(result[indicator].min, value);
                result[indicator].max = Math.max(result[indicator].max, value);
            }
        });

    return result;
};

export const getFeatureIndicators = function (data: any[],
                                              selectedFeatures: Feature[],
                                              indicatorsMeta: ChoroplethIndicatorMetadata[],
                                              indicatorRanges: Dict<NumericRange>,
                                              filters: Filter[],
                                              selectedFilterValues: Dict<FilterOption[]>,
                                              minRadius: number,
                                              maxRadius: number): Dict<BubbleIndicatorValuesDict> {

    const selectedAreaIds = selectedFeatures.map(f => f.properties!!.area_id);

    const result = {} as Dict<BubbleIndicatorValuesDict>;
    iterateDataValues(data, indicatorsMeta, selectedAreaIds, filters, selectedFilterValues,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
        if (!result[areaId]) {
               result[areaId] = {} as BubbleIndicatorValuesDict;
        }

        const indicator = indicatorMeta.indicator;

        const regionValues = result[areaId];
        regionValues[indicator] = {
           value: value,
           color: getColor(value, indicatorMeta), //TODO: put this function. shared with Choropleth, in a more generic place
           radius: getRadius(value, indicatorRanges[indicator].min, indicatorRanges[indicator].max, minRadius, maxRadius)
        }
    });

    return result;
};

export const getRadius = function(value: number, minValue: number, maxValue: number, minRadius: number, maxRadius: number){
    //where is value on a scale of 0-1 between minValue and maxValue
    const scalePoint = (value - minValue) / (maxValue - minValue);

    return Math.sqrt(Math.pow(minRadius, 2) + (scalePoint * (Math.pow(maxRadius, 2) - Math.pow(minRadius, 2))));
};

