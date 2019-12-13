import {BubbleIndicatorValuesDict, Dict, Filter, IndicatorValuesDict} from "../../../types";
import {getColor} from "../../../store/filteredData/utils";
import {Feature} from "geojson";
import {ChoroplethIndicatorMetadata} from "../../../generated";

export const toIndicatorNamelLookup = (array: ChoroplethIndicatorMetadata[]) =>
    array.reduce((obj, current) => {
        obj[current.indicator] = current.name;
        return obj
    }, {} as Dict<string>);

export const getFeatureIndicators = function (data: any[],
                                              selectedFeatures: Feature[],
                                              indicatorsMeta: ChoroplethIndicatorMetadata[],
                                              minRadius: number,
                                              maxRadius: number): Dict<BubbleIndicatorValuesDict> {

    const result = {} as Dict<BubbleIndicatorValuesDict>;

    const selectedAreaIds = selectedFeatures.map(f => f.properties!!.area_id);

    const minArea = Math.PI * Math.pow(minRadius, 2);
    const maxArea = Math.PI * Math.pow(maxRadius, 2);

    for (const row of data) {

        //TODO: exclude rows based on filters
       /* if (excludeRow(row, selectedRegionFilters)) {
            continue;
        }*/

        const areaId: string = row.area_id;

        if (!selectedAreaIds.includes(areaId)) {
            continue;
        }

        for (const metadata of indicatorsMeta) {

            const indicator = metadata.indicator;

            if (metadata.indicator_column && metadata.indicator_value != row[metadata.indicator_column]) {
                //This data is in long format, and the indicator column's value does not match that for this indicator
                continue;
            }

            if (!row[metadata.value_column]) {
                //No value for this indicator in this row
                continue;
            }

            const value = row[metadata.value_column];

            if (!result[areaId]) {
                result[areaId] = {} as BubbleIndicatorValuesDict;
            }

            const regionValues = result[areaId];
            regionValues[indicator] = {
                value: value,
                color: getColor(value, metadata), //TODO: put this function. shared with Choropleth, in a more generic place
                size: getRadius(value, metadata.min, metadata.max, minArea, maxArea)
            }
        }
    }

    return result;
};

export const getRadius = function(value: number, minValue: number, maxValue: number, minArea: number, maxArea: number){
    value = Math.min(maxValue, value);
    value = Math.max(minValue, value);

    //where is value on a scale of 0-1 between minValue and maxValue
    const scalePoint = (value - minValue) / (maxValue - minValue);
    const area = minArea + (scalePoint * (maxArea - minArea));
    return  Math.sqrt(area/Math.PI);
};