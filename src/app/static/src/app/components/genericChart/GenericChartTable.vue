<template>
    <table-view :fields="generatedFields" :filtered-data="filteredData">
    </table-view>
</template>

<script lang="ts">
    import Vue from "vue";
    import {FilterOption} from "../../generated";
    import {
        Dict,
        Filter,
        GenericChartTableConfig
    } from "../../types";
    import TableView, {Field} from "../plots/table/Table.vue";;

    interface Props {
        filteredData: any[],
        filters: Filter[],
        selectedFilterOptions: Dict<FilterOption[]>,
        tableConfig: GenericChartTableConfig
    }

    interface Computed {
        generatedFields: Field[],
        friendlyData: any[]
    }

    const props = {
        filteredData: {
            type: Array
        },
        filters: {
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
        data() {
            return {
                sortBy: '',
                sortDesc: false,
                filter: null
            }
        },
        computed: {
            generatedFields() {
                const fields = this.tableConfig.columns.map(c => {
                    let label: string;
                    if (c.header.type === "filterLabel") {
                        label = this.filters.find(f => f.id === c.header.filterId)?.label || c.header.filterId;
                    } else {
                        const selectedFilterOption = this.selectedFilterOptions[c.header.filterId][0];
                        label = selectedFilterOption.label;
                    }

                    return {
                        key: c.data.columnId,
                        label,
                        sortable: true,
                        sortByFormatted: true
                    };
                });

                return fields
            },
            friendlyData() {
                const filtersDict = this.filters.reduce((dict, filter) => ({...dict, [filter.id]: filter}), {} as Dict<Filter>);
                const result = this.filteredData.map(row => {
                    const friendlyRow = {...row};
                    this.tableConfig.columns.filter(column => column.data.labelFilterId).forEach(column => {
                        const filter = filtersDict[column.data.labelFilterId!];
                        const friendlyValue = filter.options.find(option => option.id == row[column.data.columnId])?.label;
                        friendlyRow[column.data.columnId] = friendlyValue;
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
