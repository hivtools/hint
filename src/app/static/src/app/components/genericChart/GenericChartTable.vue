<template>
    <div>
        <br>
        <div v-if="filteredData.length > 0">
            <b-form-group class="mb-0">
                <b-input-group size="sm">
                    <b-form-input
                            v-model="filter"
                            type="search"
                            id="filterInput"
                            :placeholder="translate('typeSearch')"></b-form-input>
                    <b-input-group-append>
                        <b-button :disabled="!filter" @click="filter = ''" v-translate="'clearText'"></b-button>
                    </b-input-group-append>
                </b-input-group>
            </b-form-group>
            <b-table
                    striped hover
                    :fields="generatedFields"
                    :items="friendlyData"
                    :sort-by.sync="sortBy"
                    :sort-desc.sync="sortDesc"
                    :filter="filter"
                    responsive="sm"
                    show-empty>
            </b-table>
        </div>
        <div v-else v-translate="'noData'"></div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import {FilterOption} from "../../generated";
    import {
        Dict,
        Filter,
        GenericChartTableConfig
    } from "../../types";
    import {mapStateProp} from "../../utils";
    import {BButton, BFormGroup, BFormInput, BInputGroup, BInputGroupAppend, BTable} from 'bootstrap-vue';
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";

    interface Props {
        filteredData: any[],
        filters: Filter[],
        selectedFilterOptions: Dict<FilterOption[]>,
        tableConfig: GenericChartTableConfig
    }

    interface Field {
        key: string,
        label?: string
    }

    interface Methods {
        translator: string
    }

    interface Computed {
        generatedFields: Field[],
        friendlyData: any[],
        currentLanguage: Language
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
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "table-view",
        props: props,
        data() {
            return {
                sortBy: '',
                sortDesc: false,
                filter: null
            }
        },
        methods: {
            translate(word: string) {
                return i18next.t(word, {lng: this.currentLanguage})
            },
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
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language)
        },
        components: {
            BTable,
            BFormGroup,
            BFormInput,
            BInputGroup,
            BButton,
            BInputGroupAppend
        }
    });
</script>
