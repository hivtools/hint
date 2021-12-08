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
    import {FilterOption, NestedFilterOption} from "../../generated";
    import {Dict, GenericChartColumn, GenericChartTableColumnConfig, GenericChartTableConfig} from "../../types";
    import TableView, {Field} from "../plots/table/Table.vue";

    interface Props {
        filteredData: any[],
        columns: GenericChartColumn[],
        selectedFilterOptions: Dict<FilterOption[]>,
        tableConfig: GenericChartTableConfig
    }

    interface Computed {
        generatedFields: Field[],
        labelledData: any[],
        columnsWithHierarchy: GenericChartTableColumnConfig[],
        hierarchyColumnPaths: Dict<Dict<string>>
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
               this.columnsWithHierarchy.forEach((columnConfig) => {
                   const columnId = columnConfig.data.hierarchyColumn!;
                   const pathsDict = {};
                   const column = this.columns.find((column) => column.id == columnId)!;
                   addPathsToDict(column.values as any, "", pathsDict);
                   result[columnId] = pathsDict;
               });
               return result;
            },
            labelledData() {
                // Build a dictionary of the columns defined in the fetched dataset, which include all values and
                // associated labels
                const columnsDict = this.columns.reduce((dict, column) => ({...dict, [column.id]: column}), {} as Dict<GenericChartColumn>);

                // Convert each label column's filter options to a dictionary of id to labels so we do not need to find values'
                // labels in the options array per row
                const configLabelColumns = this.tableConfig.columns.filter(column => column.data.labelColumn);
                const columnValueLabels = configLabelColumns.reduce((dict, columnConfig) => {
                    const key = columnConfig.data.labelColumn!;
                    // If key is not already in dictionary, and options are an array (not the case for hierarchies)
                    if (!dict[key] && columnsDict[key].values.reduce) {
                        const filterOptions = columnsDict[key].values;
                        const labelDict = filterOptions.reduce((dict, option) => ({
                            ...dict,
                            [option.id]: option.label
                        }), {} as Dict<string>);

                        return {
                            ...dict,
                            [key]: labelDict
                        }
                    } else {
                        return dict;
                    }
                }, {} as Dict<Dict<string>>);

                const result = this.filteredData.map(row => {
                    const friendlyRow = {...row};
                    // Check the table configuration for each configured column, and replace data values
                    // with friendly values (labels) taken from columnValueLabels where configured to do so - i.e.
                    // when there is a 'labelColumn' value
                    configLabelColumns.forEach(columnConfig => {
                        const columnId = columnConfig.data.columnId;
                        const rowValue = row[columnId];
                        friendlyRow[columnId] = columnValueLabels[columnConfig.data.labelColumn!][rowValue];
                    });

                    // Include additional fields for any columns configured to include hierarchy values - use the
                    // configured column's data column id, suffixed with '_hierarchy' as the field id
                    this.columnsWithHierarchy.forEach((columnConfig) => {
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
