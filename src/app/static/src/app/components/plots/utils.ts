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

export const getIndicatorRanges = function (data: any,
                                            indicatorsMeta: ChoroplethIndicatorMetadata[],
                                            filters: Filter[] | null = null,
                                            selectedFilterValues: Dict<FilterOption[]> | null = null,
                                            selectedAreaIds: string[] | null = null): Dict<NumericRange> {
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

    return Object.freeze(result);
};

export const getDynamicFilteredColourRanges = function (data: any,
                                                        indicatorsMeta: ChoroplethIndicatorMetadata[],
                                                        filters: Filter[],
                                                        selectedFilterValues: Dict<FilterOption[]>,
                                                        selectedAreaIds: string[]) {
    const result = {} as Dict<NumericRange>;
    let filteredIndicatorRanges = null;

    for (const meta of indicatorsMeta) {
        const indicatorId = meta.indicator;

        if (!filteredIndicatorRanges) {
            filteredIndicatorRanges = getIndicatorRanges(data, indicatorsMeta, filters, selectedFilterValues, selectedAreaIds);
        }

        result[indicatorId] = roundRange({
            min: filteredIndicatorRanges[indicatorId] ? filteredIndicatorRanges[indicatorId].min : 0,
            max: filteredIndicatorRanges[indicatorId] ? filteredIndicatorRanges[indicatorId].max : 0
        });
    }
    return result;
};

export const getDefaultColourRanges = function (indicatorsMeta: ChoroplethIndicatorMetadata[]) {
    const result = {} as Dict<NumericRange>;

    for (const meta of indicatorsMeta) {
        const indicatorId = meta.indicator;
        result[indicatorId] = {min: meta.min, max: meta.max};
    }
    return result;
};


export const getCustomColourRanges = function (indicatorsMeta: ChoroplethIndicatorMetadata[], colourScales: ColourScaleSelections,) {
    const result = {} as Dict<NumericRange>;

    for (const meta of indicatorsMeta) {
        const indicatorId = meta.indicator;
        const colourScale = colourScales[indicatorId];
        result[indicatorId] = {min: colourScale.customMin, max: colourScale.customMax};
    }
    return result;
};

export const getColourRanges = function (data: any,
                                         indicatorsMeta: ChoroplethIndicatorMetadata[],
                                         colourScales: ColourScaleSelections,
                                         filters: Filter[],
                                         selectedFilterValues: Dict<FilterOption[]>,
                                         selectedAreaIds: string[]) {
    const result = {} as Dict<NumericRange>;
    let fullIndicatorRanges = null;
    let filteredIndicatorRanges = null;

    for (const meta of indicatorsMeta) {
        const indicatorId = meta.indicator;
        const colourScale = colourScales[indicatorId];
        const colourScaleType = colourScale ? colourScale.type : ColourScaleType.Default;
        switch (colourScaleType) {
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

                result[indicatorId] = roundRange({
                    min: fullIndicatorRanges[indicatorId] ? fullIndicatorRanges[indicatorId].min : 0,
                    max: fullIndicatorRanges[indicatorId] ? fullIndicatorRanges[indicatorId].max : 0
                });
                break;
            case(ColourScaleType.DynamicFiltered):
                if (!filteredIndicatorRanges) {
                    filteredIndicatorRanges = getIndicatorRanges(data, indicatorsMeta, filters, selectedFilterValues, selectedAreaIds);
                }

                result[indicatorId] = roundRange({
                    min: filteredIndicatorRanges[indicatorId] ? filteredIndicatorRanges[indicatorId].min : 0,
                    max: filteredIndicatorRanges[indicatorId] ? filteredIndicatorRanges[indicatorId].max : 0
                });
                break;
            default:
                break;
        }
    }
    return result;
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
           indicatorMeta: ChoroplethIndicatorMetadata, value: number) => void) {

    const selectedFilterValueIds: Dict<string[]> = {};
    const validFilters = filters && filters.filter(f => f.options && f.options.length > 0);

    if (validFilters && selectedFilterValues) {
        for (const f of validFilters) {
            selectedFilterValueIds[f.id] = selectedFilterValues[f.id].map(n => n.id)
        }
    }

    for (const row of data) {
        if (validFilters && selectedFilterValues && excludeRow(row, validFilters, selectedFilterValueIds)) {
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
