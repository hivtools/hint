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
                    :items="filteredData"
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
        GenericChartTableConfig,
        GenericChartTableSelectedFilterOptionLabel,
        GenericChartTableStringLabel
    } from "../../types";
    import {mapStateProp} from "../../utils";
    import {BButton, BFormGroup, BFormInput, BInputGroup, BInputGroupAppend, BTable} from 'bootstrap-vue';
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";

    interface Props {
        filteredData: any[],
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
        generatedFields: Array<Field>,
        currentLanguage: Language
    }

    const props = {
        filteredData: {
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
                    if (c.label.type === "string") {
                        label = (c.label as GenericChartTableStringLabel).value; //TODO: should be translation keys, not English label
                    } else {
                        const filterId = (c.label as GenericChartTableSelectedFilterOptionLabel).filterId;
                        const selectedFilterOption = this.selectedFilterOptions[filterId][0];
                        label = selectedFilterOption.label;
                    }

                    return {
                        key: c.dataColumn,
                        label,
                        sortable: true,
                        sortByFormatted: true
                    };
                });

                return fields
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
