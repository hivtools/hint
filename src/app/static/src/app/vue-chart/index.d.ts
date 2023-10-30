// declare module "@reside-ic/vue-charts" {
//     import Vue from "vue";
    
//     export class BarChartWithErrors extends Vue {}
//     export class BarChartWithFilters extends Vue {}
//     export class FilterSelect extends Vue {}

//     type Dict<V> = { [k: string]: V }

//     export interface FilterOption {
//         label: string;
//         id: string;
//     }

//     export interface Filter extends FilterOption {
//         column_id: string,
//         options: FilterOption[]
//     }

//     export interface FilterConfig {
//         indicatorLabel?: string,
//         xAxisLabel?: string,
//         disaggLabel?: string,
//         filterLabel?: string
//         filters: Filter[]
//     }

//     export interface BarchartSelections {
//         indicatorId: string,
//         xAxisId: string,
//         disaggregateById: string,
//         selectedFilterOptions:  Dict<FilterOption[]>
//     }

//     export interface BarchartIndicator {
//         indicator: string,
//         value_column: string,
//         indicator_column: string,
//         indicator_value: string,
//         name: string,
//         error_low_column: string,
//         error_high_column: string
//     }

// }
