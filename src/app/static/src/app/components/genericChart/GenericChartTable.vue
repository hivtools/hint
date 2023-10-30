<template>
    <table-view :fields="generatedFields" :filtered-data="labelledData">
        <template v-for="column in columnsWithHierarchy" v-slot:[`cell(${column.data.columnId})`]="data" :key="column.data.columnId">
            <div>
                <div class="column-data">{{ data.item[column.data.columnId] }}</div>
                <div class="small">{{ data.item[`${column.data.columnId}_hierarchy`] }}</div>
            </div>
        </template>
    </table-view>
</template>

<script lang="ts">
    import { PropType, defineComponent } from "vue";
    import {FilterOption, NestedFilterOption} from "../../generated";
    import {Dict, Field, GenericChartColumn, GenericChartColumnValue, GenericChartTableColumnConfig, GenericChartTableConfig} from "../../types";
    import TableView from "../plots/table/Table.vue";
    import {format} from "d3-format";

    export default defineComponent({
        name: "GenericChartTable",
        props: {
            filteredData: {
                type: Array as PropType<any[]>,
                required: true
            },
            columns: {
                type: Array as PropType<GenericChartColumn[]>,
                required: true
            },
            selectedFilterOptions: {
                type: Object as PropType<Dict<FilterOption[]>>,
                required: true
            },
            tableConfig: {
                type: Object as PropType<GenericChartTableConfig>,
                required: true
            },
            valueFormat: {
                type: String,
                required: false
            }
        },
        computed: {
            generatedFields() {
                return this.tableConfig.columns.map((column: GenericChartTableColumnConfig) => {
                    let label: string;
                    if (column.header.type === "columnLabel") {
                        label = this.columns.find((f: GenericChartColumn) => f.id === column.header.column)?.label || column.header.column;
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
                return this.tableConfig.columns.filter((column: GenericChartTableColumnConfig) => column.data.hierarchyColumn);
            },
            hierarchyColumnPaths() {
               // Generate a dictionary of dictionaries allowing hierarchy label lookup for all  hierarchy columns (i.e. area)
               // to save the hierarchy string for each option. This traverses the entire hierarchy once only, which is
               // quicker than calling findPath on each row value.
               const addPathsToDict = (option: NestedFilterOption, parentPath: string,  dict: Dict<string>) => {
                   //Add the path for this item...
                   dict[option.id] = parentPath;
                   //...then adds paths for any children
                   const path = parentPath + (parentPath.length ? "/" : "") + option.label;
                   if (option.children) {
                       option.children.forEach((child) => addPathsToDict(child as NestedFilterOption, path, dict));
                   }
               };

               const result = {} as Dict<Dict<string>>;
               this.columnsWithHierarchy.forEach((columnConfig: GenericChartTableColumnConfig) => {
                   const columnId = columnConfig.data.hierarchyColumn!;
                   const pathsDict = {};
                   const column = this.columns.find((column: GenericChartColumn) => column.id == columnId)!;
                   // Deal with both array or object as top-level values type
                   const values = Array.isArray(column.values) ? column.values : [column.values];
                   values.forEach((value: GenericChartColumnValue) => addPathsToDict(value, "", pathsDict));
                   result[columnId] = pathsDict;
               });
               return result;
            },
            labelledData() {
                // Build a dictionary of the columns defined in the fetched dataset, which include all values and
                // associated labels
                const columnsDict = this.columns.reduce((dict: Dict<GenericChartColumn>, column: GenericChartColumn) => ({...dict, [column.id]: column}), {} as Dict<GenericChartColumn>);
                const formatFunc = this.valueFormat ? format(this.valueFormat) : null;

                const result = this.filteredData.map((row: any) => {
                    const friendlyRow = {} as Dict<unknown>;
                    this.tableConfig.columns.forEach((columnConfig: GenericChartTableColumnConfig) => {
                        const columnId = columnConfig.data.columnId;
                        if (columnConfig.data.labelColumn) {
                            const column = columnsDict[columnConfig.data.labelColumn!];
                            const friendlyValue = column.values.find((value: GenericChartColumnValue) => value.id == row[columnConfig.data.columnId])?.label;
                            friendlyRow[columnId] = friendlyValue;
                        } else if (formatFunc && columnConfig.data.useValueFormat) {
                            friendlyRow[columnId] = formatFunc(row[columnId]);
                        } else {
                            friendlyRow[columnId] = row[columnId];
                        }
                    });

                    // Include additional fields for any columns configured to include hierarchy values - use the
                    // configured column's data column id, suffixed with '_hierarchy' as the field id
                    this.columnsWithHierarchy.forEach((columnConfig: GenericChartTableColumnConfig) => {
                        const hierarchyColumn = columnsDict[columnConfig.data.hierarchyColumn!];
                        const value = row[hierarchyColumn.column_id];
                        friendlyRow[`${columnConfig.data.columnId}_hierarchy`] = this.hierarchyColumnPaths[hierarchyColumn.id][value];
                    });
                    return friendlyRow;
                });
                return result;
            }
        },
        components: {
            TableView
        }
    });
</script>
