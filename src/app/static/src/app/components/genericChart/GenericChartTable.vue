<template>
    <div>
    <div>{{hierarchyColumnPaths}}</div>
    <table-view :fields="generatedFields" :filtered-data="labelledData">
        <template v-for="column in columnsWithHierarchy" v-slot:[`cell(${column.data.columnId})`]="data">
            <div :key="column.data.columnId">
                <div class="column-data">{{ data.item[column.data.columnId] }}</div>
                <div class="small">{{ data.item[`${column.data.columnId}_hierarchy`] }}</div>
            </div>
        </template>
    </table-view>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FilterOption, NestedFilterOption} from "../../generated";
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
                console.log("Started hierarchyColumnsToPaths: " + new Date().toISOString())
               const addPathsToDict = (option: NestedFilterOption, parentPath: string,  dict: Dict<string>) => {
                   dict[option.id] = parentPath;
                   const path = parentPath + (parentPath.length ? "/" : "") + option.label;
                   if (option.children) {
                       option.children.forEach((child: any) => addPathsToDict(child as any, path, dict));
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
                console.log("Finished hierarchyColumnsToPaths: " + new Date().toISOString())
               return result;
            },
            labelledData() {
                console.log("Starting labelledData: " + new Date().toISOString())
                // Build a dictionary of the columns defined in the fetched dataset, which include all values and
                // associated labels
                const columnsDict = this.columns.reduce((dict, column) => ({...dict, [column.id]: column}), {} as Dict<GenericChartColumn>);

                //This above gives a dict of column ids to metadata columns, with all metadata
                // We actually want to key filter option labels by id
                // Map each column's filter options to a dictionary of id to label
                const columnValueLabels = Object.keys(columnsDict).reduce((dict, key) => {
                    const filterOptions = columnsDict[key].values;
                    const labelDict = filterOptions.reduce ? filterOptions.reduce((dict, o) => ({...dict, [o.id]: o.label}), {} as Dict<string>) : {};
                    return {
                        ...dict,
                        [key]: labelDict
                    }
                }, {} as Dict<Dict<string>>);
                console.log("Finished making value labels dict: " + new Date().toISOString())

                const configLabelColumns = this.tableConfig.columns.filter(column => column.data.labelColumn);
                const result = this.filteredData.map(row => {
                    const friendlyRow = {...row};
                    // Check the table configuration for each configured column, and replace data values
                    // with friendly values (labels) taken from columnValueLabels where configured to do so - i.e.
                    // when there is a 'labelColumn' value
                    configLabelColumns.forEach(columnConfig => {
                        //const column = columnsDict[columnConfig.data.labelColumn!];
                        //const friendlyValue = column.values.find(value => value.id == row[columnConfig.data.columnId])?.label;
                        const rowValue = row[columnConfig.data.columnId];
                        const friendlyValue = columnValueLabels[columnConfig.data.labelColumn!][rowValue];
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
                console.log("Finished labelledData: " + new Date().toISOString())
                return result;
            }
        },
        components: {
            TableView
        }
    });
</script>
