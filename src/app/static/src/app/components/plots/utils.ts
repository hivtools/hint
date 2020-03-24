import * as d3ScaleChromatic from "d3-scale-chromatic";
import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
import {Dict, Filter, NumericRange} from "../../types";
import {ColourScaleSelections, ColourScaleType} from "../../store/plottingSelections/plottingSelections";

export const getColor = (value: number, metadata: ChoroplethIndicatorMetadata,
                         colourRange: NumericRange) => {

    const min = colourRange.min;
    const max = colourRange.max;

    const colorFunction = colorFunctionFromName(metadata.colour);

    let rangeNum = ((max !== null) && (max != min)) ? //Avoid dividing by zero if only one value...
        max - (min || 0) :
        1;

    let colorValue = (value - min) / rangeNum;

    if (metadata.invert_scale) {
        colorValue = 1 - colorValue;
    }

    return colorFunction(colorValue);
};

export const colourScaleStepFromMetadata = function(meta: ChoroplethIndicatorMetadata) {
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

export const getIndicatorRanges = function(data: any,
                                           indicatorsMeta: ChoroplethIndicatorMetadata[],
                                           filters: Filter[] | null = null,
                                           selectedFilterValues: Dict<FilterOption[]> | null = null,
                                           selectedAreaIds: string[] | null = null): Dict<NumericRange>{
    const result = {} as Dict<NumericRange>;
    iterateDataValues(data, indicatorsMeta, selectedAreaIds, filters, selectedFilterValues,
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

export const getColourRanges = function(data: any,
                                        indicatorsMeta: ChoroplethIndicatorMetadata[],
                                        colourScales: ColourScaleSelections,
                                        filters: Filter[],
                                        selectedFilterValues: Dict<FilterOption[]>,
                                        selectedAreaIds: string[]) {
  const result = {} as Dict<NumericRange>;
  let fullIndicatorRanges = null;
  let filteredIndicatorRanges = null;

  for(const meta of indicatorsMeta) {
        const indicatorId = meta.indicator;
        const colourScale = colourScales[indicatorId];
        const colourScaleType = colourScale ? colourScale.type : ColourScaleType.Default;
        switch(colourScaleType) {
            case(ColourScaleType.Default):
                result[indicatorId] = {min: meta.min, max: meta.max};
                break;
            case(ColourScaleType.Custom):
                result[indicatorId] = {min: colourScale.customMin, max: colourScale.customMax};
                break;
            case(ColourScaleType.DynamicFull):
                if (!fullIndicatorRanges) {
                    fullIndicatorRanges = getIndicatorRanges(data, indicatorsMeta, null, null, null);
                }
                result[indicatorId] = {min: fullIndicatorRanges[indicatorId].min, max: fullIndicatorRanges[indicatorId].max};
                break;
            case(ColourScaleType.DynamicFiltered):
                if (!filteredIndicatorRanges) {
                    filteredIndicatorRanges = getIndicatorRanges(data, indicatorsMeta, filters, selectedFilterValues, selectedAreaIds);
                }

                result[indicatorId] = {min: filteredIndicatorRanges[indicatorId].min, max: filteredIndicatorRanges[indicatorId].max};
                break;
            default:
                break;
        }
  }
  return result;
};

export const iterateDataValues = function(
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

            if (!row[metadata.value_column] && row[metadata.value_column] !== 0) {
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
        if (!filter.options || filter.options.length == 0) {
            continue;
        }
        const filterValues = selectedFilterValues[filter.id].map(n => n.id);
        if (filterValues.indexOf(row[filter.column_id].toString()) < 0) {
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
    for(const contextValue of context) {
        const maxFraction = contextValue.toString().split(".");
        const decPl = maxFraction.length > 1 ? maxFraction[1].length : 0;
        maxDecPl = Math.max(maxDecPl, decPl);
    }

    const roundingNum = Math.pow(10, maxDecPl + 1);

    return Math.round(value * roundingNum) / roundingNum;
};
