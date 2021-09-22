<template>
   <table-view :filtered-data="filteredData" :fields="generatedFields">
        <template v-slot:cell(areaLabel)="data">
            <div>{{ data.item.areaLabel }}</div>
            <div class="small">{{ data.item.areaHierarchy }}</div>
        </template>
        <template v-for="i in indicators" v-slot:[`cell(${i.indicator})`]="data">
            <div :key="i.indicator">
                <div class="value">{{ data.item[i.indicator] }}</div>
                <div class="small" v-if="data.item[`${i.indicator}_lower`]">
                    ({{ data.item[`${i.indicator}_lower`] }} – {{ data.item[`${i.indicator}_upper`] }})
                </div>
            </div>
        </template>
        <template v-slot:emptyfiltered>
            <p class="text-center" v-translate="'noRecords'"></p>
        </template>
   </table-view>
</template>

<script lang="ts">
    import Vue from "vue";
    import i18next from "i18next";
    import TableView, {Field} from "./Table.vue";
    import {findPath, iterateDataValues, formatOutput} from "../utils";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {Dict, Filter} from "../../../types";
    import {flattenOptions, flattenToIdSet, mapStateProp} from "../../../utils";
    import {RootState} from "../../../root";
    import {Language} from "../../../store/translations/locales";

    interface Props {
        tabledata: any[],
        indicators: ChoroplethIndicatorMetadata[],
        selections: {
            indicatorId: string,
            selectedFilterOptions: Dict<FilterOption[]>,
            detail: number | null
        },
        filters: Filter[],
        countryAreaFilterOption: NestedFilterOption,
        areaFilterId: string
    }

    interface DisplayRow {
        areaLabel: string,
        areaHierarchy: string
    }

    interface Computed {
        nonAreaFilters: Filter[],
        filtersToDisplay: Filter[],
        areaFilter: Filter,
        filteredData: DisplayRow[],
        flattenedAreas: Dict<NestedFilterOption>,
        selectedAreaIds: string[],
        selectedAreaFilterOptions: FilterOption[],
        generatedFields: Array<Field>,
        currentLanguage: Language
    }

    const props = {
        tabledata: {
            type: Array
        },
        filters: {
            type: Array
        },
        countryAreaFilterOption: {
            type: Object
        },
        indicators: {
            type: Array
        },
        areaFilterId: {
            type: String
        },
        selectedFilterOptions: {
            type: Object
        },
        selections: {
            type: Object
        }
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "AreaIndicatorsTable",
        props: props,
        data() {
            return {
                sortBy: '',
                sortDesc: false,
                filter: null
            }
        },
        computed: {
            nonAreaFilters() {
                return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
            },
            areaFilter() {
                return this.filters.find((f: Filter) => f.id == this.areaFilterId)!;
            },
            flattenedAreas() {
                if (this.selections.detail === 0 || !this.selections.detail) {
                    return this.areaFilter ? flattenOptions([this.countryAreaFilterOption]) : {};
                }
                return this.areaFilter ? flattenOptions(this.areaFilter.options) : {};
            },
            selectedAreaIds() {
                const selectedAreaIdSet =
                    flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
                const areaArray = Array.from(selectedAreaIdSet);
                if (this.selections.detail === 0) {
                    return [areaArray[0]]
                } else if (!this.selections.detail) {
                    const selectedAreaOptions = this.selections.selectedFilterOptions.area || [];
                    return selectedAreaOptions.map(row => row.id)
                } else return areaArray.filter(val => parseInt(val[4]) === this.selections.detail);
            },
            selectedAreaFilterOptions() {
                const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
                if (this.selections.detail === 0) {
                    return this.countryAreaFilterOption ? [this.countryAreaFilterOption] : []
                } else if (selectedOptions && selectedOptions.length > 0) {
                    return selectedOptions
                } else return this.areaFilter ? this.areaFilter.options : []; //consider all top level areas to be selected if none are
            },
            filtersToDisplay() {
                return this.nonAreaFilters.filter(f => f.options.length > 0)
            },
            filteredData() {
                const filteredValues: any[] = [];
                iterateDataValues(this.tabledata,
                    this.indicators,
                    this.selectedAreaIds,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: any) => {
                        const filterValues: Dict<any> = {};
                        this.filtersToDisplay.forEach(f => {
                            if (row[f.column_id]) {
                                filterValues[f.id] = row[f.column_id]
                            }
                        });
                        const {upper, lower} = row
                        filteredValues.push({areaId, filterValues, indicatorMeta, value, upper, lower});
                    });
                const displayRows: Dict<any> = {};
                filteredValues.forEach(current => {
                    const key = [current.areaId, ...this.nonAreaFilters.map(f => current.filterValues[f.id])].join("_");
                    if (!(key in displayRows)) {
                        const areaLabel = this.flattenedAreas[current.areaId].label;
                        const areaHierarchy = findPath(current.areaId, this.countryAreaFilterOption.children)
                        const filterLabels: Dict<string> = {};
                        Object.keys(current.filterValues).forEach(k => {
                            const selectedOptions = this.selections.selectedFilterOptions[k];
                            filterLabels[k] = selectedOptions.filter(o => o.id == current.filterValues[k])[0].label;
                        });
                        displayRows[key] = {
                            areaLabel,
                            areaHierarchy,
                            ...filterLabels,
                        }
                    }
                    const {value, upper, lower} = current
                    const { indicator, format, scale, accuracy } = current.indicatorMeta
                    displayRows[key][indicator] = formatOutput(value, format, scale, accuracy);
                    displayRows[key][`${indicator}_lower`] = lower ? formatOutput(lower, format, scale, accuracy): '';
                    displayRows[key][`${indicator}_upper`] = upper ? formatOutput(upper, format, scale, accuracy): '';
                });
                return Object.values(displayRows);
            },
            generatedFields() {
                const fields: any[] = [];
                fields.push({
                    key: 'areaLabel',
                    label: i18next.t('area', {lng: this.currentLanguage})
                })
                this.filtersToDisplay.map(value => {
                    const field: Dict<any> = {};
                    field.key = value.id
                    field.label = i18next.t(value.label.toLowerCase(), {lng: this.currentLanguage})
                    fields.push(field)
                })
                this.indicators.map((value, index) => {
                    const field: Dict<any> = {};
                    field.key = value.indicator
                    field.label = value.name
                    fields.push(field)
                })
                fields.map(field => {
                    field.sortable = true
                    field.sortByFormatted = true
                })
                return fields
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language)
        },
        components: {
            TableView
        }
    });
</script>
