<template>
    <table-view :fields="generatedFields" :filtered-data="labelledData">
        <template v-for="column in columnsWithHierarchy" v-slot:[`cell(${column.data.columnId})`]="data">
            <div :key="column.data.columnId">
                <div class="column-data">{{ data.item[column.data.columnId] }}</div>
                <div class="small">{{ data.item[`${column.data.columnId}_hierarchy`] }}</div>
            </div>
        </template>
    </table-view>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FilterOption} from "../../generated";
    import {
        Dict, GenericChartColumn, GenericChartTableColumnConfig,
        GenericChartTableConfig
    } from "../../types";
    import TableView, {Field} from "../plots/table/Table.vue";
    import {findPath} from "../plots/utils";

    interface Props {
        filteredData: any[],
        columns: GenericChartColumn[],
        selectedFilterOptions: Dict<FilterOption[]>,
        tableConfig: GenericChartTableConfig
    }

    interface Computed {
        generatedFields: Field[],
        labelledData: any[],
        columnsWithHierarchy: GenericChartTableColumnConfig[]
    }

    const props = {
        filteredData: {
            type: Array
        },
        columns: {
            type: Array
        },
        selectedFilterOptions: {
            type: Object
        },
        tableConfig: {
            type: Object
        }
    };

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "GenericChartTable",
        props: props,
        computed: {
            generatedFields() {
                return this.tableConfig.columns.map(column => {
                    let label: string;
                    if (column.header.type === "columnLabel") {
                        label = this.columns.find(f => f.id === column.header.column)?.label || column.header.column;
                    } else {
                        const selectedFilterOption = this.selectedFilterOptions[column.header.column][0];
                        label = selectedFilterOption.label;
                    }

                    return {
                        key: column.data.columnId,
                        label,
                        sortable: true,
                        sortByFormatted: true
                    };
                });
            },
            columnsWithHierarchy() {
                return this.tableConfig.columns.filter(column => column.data.hierarchyColumn);
            },
            labelledData() {
                // Build a dictionary of the columns defined in the fetched dataset, which include all values and
                // associated labels
                const columnsDict = this.columns.reduce((dict, column) => ({...dict, [column.id]: column}), {} as Dict<GenericChartColumn>);
                return this.filteredData.map(row => {
                    const friendlyRow = {...row};
                    // Check the table configuration for each configured column, and replace data values
                    // with friendly values (labels) taken from the columnsDict where configured to do so - i.e.
                    // when there is a 'labelColumn' value
                    this.tableConfig.columns.filter(column => column.data.labelColumn).forEach(columnConfig => {
                        const column = columnsDict[columnConfig.data.labelColumn!];
                        const friendlyValue = column.values.find(value => value.id == row[columnConfig.data.columnId])?.label;
                        friendlyRow[columnConfig.data.columnId] = friendlyValue;
                    });
                    // Include additional fields for any columns configured to include hierarchy values - use the
                    // configured column's data column id, suffixed with '_hierarchy' as the field id
                    this.columnsWithHierarchy.forEach((columnConfig) => {
                        const hierarchyColumn = columnsDict[columnConfig.data.hierarchyColumn!];
                        const value = row[hierarchyColumn.column_id];
                        const hierarchy = findPath(value, hierarchyColumn.values);
                        friendlyRow[`${columnConfig.data.columnId}_hierarchy`] = hierarchy;
                    });
                    return friendlyRow;
                });
            }
        },
        components: {
            TableView
        }
    });
</script>
