import {DatasetFilterConfig, Dict, DisplayFilter, GenericChartColumn} from "../../types";
import {FilterOption} from "../../generated";

export const filterData = (
    unfilteredData: Dict<unknown>[],
    filters: DisplayFilter[],
    selectedFilterOptions: Dict<FilterOption[]>) => {
    const includeRow = (row: any) => filters.every(filter =>
        selectedFilterOptions[filter.id] ?
            selectedFilterOptions[filter.id].some(option => option.id === row[filter.column_id]?.toString()) :
            true
    );
    const result =  unfilteredData.filter((row: any) => includeRow(row));
    return result
};

export function genericChartColumnsToFilters(columns: GenericChartColumn[], filterConfig?: DatasetFilterConfig[]): DisplayFilter[] {
    return columns.map((column) => {
        const allowMultiple = !!(filterConfig && filterConfig.find(config => config.id == column.id)?.allowMultiple);
        return {
            id: column.id,
            column_id: column.column_id,
            label: column.label,
            options: column.values,
            allowMultiple
        }
    });
}

export function numeralJsToD3format(numeralJsFormat: string) {
    // Convert hintr metadata format (which are numeralJs style) to d3 format to be used by Plotly
    // We currently support only numeric and percentage formats, and will return empty string for any other
    // formats received, for default formatting in Plotly.
    if (numeralJsFormat === "0,0") {
        return ","
    }

    const regex = /^0(\.0+)?(%)?$/; //This will always return three matches

    const match = numeralJsFormat.match(regex);
    if (match === null) {
        return "";
    }

    const decPl = match[1] == undefined ? 0 : match[1].length - 1;
    const percent = match[2] !== undefined;
    const suffix = percent ? "%" : "f";
    return `.${decPl}${suffix}`;
}
