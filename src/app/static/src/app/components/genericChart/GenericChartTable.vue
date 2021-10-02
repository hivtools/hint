<template>
    <table-view :fields="generatedFields" :filtered-data="labelledData">
        <template v-for="c in columnsWithHierarchy" v-slot:[`cell(${c.data.columnId})`]="data">
            <div :key="c.data.columnId">
                <div>{{ data.item[c.data.columnId] }}</div>
                <div class="small">{{ data.item[`${c.data.columnId}_hierarchy`] }}</div>
            </div>
        </template>
    </table-view>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FilterOption} from "../../generated";
    import {
        Dict,
        Filter, GenericChartColumn, GenericChartTableColumnConfig,
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
                const columnsDict = this.columns.reduce((dict, column) => ({...dict, [column.id]: column}), {} as Dict<GenericChartColumn>);
                return this.filteredData.map(row => {
                    const friendlyRow = {...row};
                    this.tableConfig.columns.filter(column => column.data.labelColumn).forEach(columnConfig => {
                        const column = columnsDict[columnConfig.data.labelColumn!];
                        const friendlyValue = column.values.find(value => value.id == row[columnConfig.data.columnId])?.label;
                        friendlyRow[columnConfig.data.columnId] = friendlyValue;
                    });
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
