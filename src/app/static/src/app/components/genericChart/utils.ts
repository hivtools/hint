import {DatasetFilterConfig, Dict, DisplayFilter, GenericChartColumn} from "../../types";
import {FilterOption} from "../../generated";

export const filterData = (
    unfilteredData: Dict<unknown>[],
    filters: DisplayFilter[],
    selectedFilterOptions: Dict<FilterOption[]>) => {
    const includeRow = (row: any) => filters.every(filter =>
        selectedFilterOptions[filter.id] ?
            selectedFilterOptions[filter.id].some(option => option.id === row[filter.column_id].toString()) :
            true
    );
    return unfilteredData.filter((row: any) => includeRow(row));
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
