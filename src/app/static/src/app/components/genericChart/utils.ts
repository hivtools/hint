import {Dict, DisplayFilter} from "../../../app/types";
import {FilterOption} from "../../../app/generated";

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
