import * as d3ScaleChromatic from "d3-scale-chromatic";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
import {Dict, Filter, NumericRange} from "../../types";

export const getColor = (value: number, metadata: ChoroplethIndicatorMetadata,
                         colourRange: NumericRange) => {

    const min = colourRange.min;
    const max = colourRange.max;

    const colorFunction = colorFunctionFromName(metadata.colour);

    const rangeNum = ((max !== null) && (max != min)) ? //Avoid dividing by zero if only one value...
        max - (min || 0) :
        1;

    let colorValue = (value - min) / rangeNum;
    if (colorValue > 1) {
        colorValue = 1;
    }
    if (colorValue < 0) {
        colorValue = 0;
    }

    if (metadata.invert_scale) {
        colorValue = 1 - colorValue;
    }

    return colorFunction(colorValue);
};

export const colourScaleStepFromMetadata = function (meta: ChoroplethIndicatorMetadata) {
    return (meta.max - meta.min) / 10;
};

export const colorFunctionFromName = function (name: string) {
    let result = (d3ScaleChromatic as any)[name];
    if (!result) {
        //This is trying to be defensive against typos in metadata...
        console.warn(`Unknown color function: ${name}`);
        result = d3ScaleChromatic.interpolateWarm;
    }
    return result;
};

export const getIndicatorRange = function (data: any,
                                           indicatorMeta: ChoroplethIndicatorMetadata,
                                           filters: Filter[] | null = null,
                                           selectedFilterValues: Dict<FilterOption[]> | null = null,
                                           selectedAreaIds: string[] | null = null): NumericRange {
    let result = {} as NumericRange;
    iterateDataValues(data, [indicatorMeta], selectedAreaIds, filters, selectedFilterValues,
        (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number) => {
            if (!result.max) {
                result = {min: value, max: value};
            } else {
                result.min = Math.min(result.min, value);
                result.max = Math.max(result.max, value);
            }
        });
    return roundRange({
        min: result ? result.min : 0,
        max: result ? result.max : 0
    });
};

export const roundRange = function (unrounded: NumericRange) {
    //round appropriate to the range magnitude
    let decPl = 0;
    let magnitude = unrounded.max == unrounded.min ? unrounded.min : (unrounded.max - unrounded.min);

    magnitude = magnitude / 100;
    if (magnitude < 1 && magnitude > 0) {
        decPl = Math.trunc(Math.abs(Math.log10(magnitude)));
    }

    return {min: roundToPlaces(unrounded.min, decPl), max: roundToPlaces(unrounded.max, decPl)};
};

export const iterateDataValues = function (
    data: any,
    indicatorsMeta: ChoroplethIndicatorMetadata[],
    selectedAreaIds: string[] | null,
    filters: Filter[] | null,
    selectedFilterValues: Dict<FilterOption[]> | null,
    func: (areaId: string,
           indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: any) => void) {

    const selectedFilterValueIds: Dict<string[]> = {};
    const validFilters = filters && selectedFilterValues
        && filters.filter(f => f.options && f.options.length > 0 && selectedFilterValues!.hasOwnProperty(f.id));

    if (validFilters) {
        for (const f of validFilters) {
            selectedFilterValueIds[f.id] = selectedFilterValues![f.id].map(n => n.id)
        }
    }
    for (const row of data) {
        if (validFilters && excludeRow(row, validFilters, selectedFilterValueIds)) {
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

            if (!row[metadata.value_column] && row[metadata.value_column] !== 0) {
                //No value for this indicator in this row
                continue;
            }

            const value = row[metadata.value_column];

            func(areaId, metadata, value, row);
        }
    }
};

const excludeRow = function (row: any, filters: Filter[], selectedFilterValues: Dict<string[]>) {
    let excludeRow = false;
    for (const filter of filters) {
        if (selectedFilterValues[filter.id].indexOf(row[filter.column_id].toString()) < 0) {
            excludeRow = true;
            break;
        }
    }
    return excludeRow;
};

export const toIndicatorNameLookup = (array: ChoroplethIndicatorMetadata[]) =>
    array.reduce((obj, current) => {
        obj[current.indicator] = current.name;
        return obj
    }, {} as Dict<string>);

export const roundToContext = function (value: number, context: number[]) {
    //Rounds the value to one more decimal place than is present in the 'context'
    let maxDecPl = 0;
    for (const contextValue of context) {
        const maxFraction = contextValue.toString().split(".");
        const decPl = maxFraction.length > 1 ? maxFraction[1].length : 0;
        maxDecPl = Math.max(maxDecPl, decPl + 1);
    }

    return roundToPlaces(value, maxDecPl);
};

const roundToPlaces = function (value: number, decPl: number) {
    const roundingNum = Math.pow(10, decPl);
    return Math.round(value * roundingNum) / roundingNum;
};

// Iteratively passes through the layers of a FilterOption object to find the regional hierarchy above the supplied id
// Takes param any for obj and returns any because it will iterate through both objects (the NestedFilterOption) and arrays (the array of child options), treating array indices as keys
export const findPath = function (id: string, obj: any): any {
  for(var key in obj) {                                         
      if(obj.hasOwnProperty(key)) {                         
          if(id === obj[key]) return "";                      
          else if(obj[key] && typeof obj[key] === "object") {   
              var path = findPath(id, obj[key]);               
              if (path != undefined) {
                return ((obj.label ? obj.label + "/": "") + path).replace(/\/$/, '');   
              }              
          }
      }
  }
};

// for (const key in obj) {
//     if (obj.hasOwnProperty(key)) {
//         if (id === obj[key]) return "";
//         else if (obj[key] && typeof obj[key] === "object") {
//             const path = findPath(id, obj[key]);
//             if (path != undefined) {
//                 return ((obj.label ? obj.label + "/" : "") + path).replace(/\/$/, '');
//             }
//         }
//     }
// }

var numeral = require('numeral')

export const formatOutput = function (value: number | string, format: string, scale: number) {
    let ans: number
    if (typeof(value) === 'string'){
        ans = parseFloat(value)
    } else ans = value
    if (!format.includes('%')){
        ans = Math.round(ans / scale) * scale
    }
    return numeral(ans).format(format)
};

interface Indicator {
    indicator: string, format: string, scale: number
}

export const findMetaData = function(indicators: Indicator[], indicatorId: string){
    return indicators.reduce((acc: Indicator, value: Indicator) => {
    if (value.indicator === indicatorId){
        acc = value
    }
    return acc
});
}