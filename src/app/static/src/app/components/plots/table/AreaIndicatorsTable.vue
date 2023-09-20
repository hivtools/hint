<template>
   <table-view :filtered-data="filteredData" :fields="generatedFields">
        <template v-slot:cell(areaLabel)="data">
            <div>{{ data.item.areaLabel }}</div>
            <div class="small">{{ data.item.areaHierarchy }}</div>
        </template>
        <template v-for="i in indicators" v-slot:[`cell(${i.indicator})`]="data" :key="i.indicator">
            <div>
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
    import i18next from "i18next";
    import TableView from "./Table.vue";
    import {findPath, iterateDataValues, formatOutput} from "../utils";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {Dict, Filter} from "../../../types";
    import {flattenOptions, flattenToIdSet, mapStateProp} from "../../../utils";
    import {RootState} from "../../../root";
    import {Language} from "../../../store/translations/locales";
    import { PropType, defineComponent } from "vue";


    type LocalSelections = {
        selectedFilterOptions: Dict<FilterOption[]>,
        detail: number | null
    }

    export default defineComponent({
        name: "AreaIndicatorsTable",
        props: {
            tableData: {
                type: Array as PropType<any[]>,
                required: true
            },
            filters: {
                type: Array as PropType<Filter[]>,
                required: true
            },
            countryAreaFilterOption: {
                type: Object as PropType<NestedFilterOption>,
                required: true
            },
            indicators: {
                type: Array as PropType<ChoroplethIndicatorMetadata[]>,
                required: true
            },
            areaFilterId: {
                type: String,
                required: true
            },
            selections: {
                type: Object as PropType<LocalSelections>,
                required: true
            },
            translateFilterLabels: {
                type: Boolean,
                required: false,
                default: true
            },
            roundFormatOutput: {
                type: Boolean,
                required: false,
                default: true
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
                    flattenToIdSet(this.selectedAreaFilterOptions.map((o: FilterOption) => o.id), this.flattenedAreas);
                const areaArray = Array.from(selectedAreaIdSet);
                if (this.selections.detail === 0) {
                    return [areaArray[0]]
                } else if (!this.selections.detail) {
                    const selectedAreaOptions = this.selections.selectedFilterOptions.area || [];
                    return selectedAreaOptions.map((row: FilterOption) => row.id)
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
                return this.nonAreaFilters.filter((f: Filter) => f.options.length > 0)
            },
            filteredData() {
                const filteredValues: any[] = [];
                iterateDataValues(this.tableData,
                    this.indicators,
                    this.selectedAreaIds,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    (areaId: string, indicatorMeta: ChoroplethIndicatorMetadata, value: number, row: any) => {
                        const filterValues: Dict<any> = {};
                        this.filtersToDisplay.forEach((f: Filter) => {
                            if (row[f.column_id]) {
                                filterValues[f.id] = row[f.column_id]
                            }
                        });
                        const {upper, lower} = row
                        filteredValues.push({areaId, filterValues, indicatorMeta, value, upper, lower});
                    });
                const displayRows: Dict<any> = {};
                filteredValues.forEach(current => {
                    const key = [current.areaId, ...this.nonAreaFilters.map((f: Filter) => current.filterValues[f.id])].join("_");
                    if (!(key in displayRows)) {
                        const areaLabel = this.flattenedAreas[current.areaId].label;
                        const areaHierarchy = findPath(current.areaId, this.countryAreaFilterOption.children)
                        const filterLabels: Dict<string> = {};
                        Object.keys(current.filterValues).forEach(k => {
                            const selectedOptions = this.selections.selectedFilterOptions[k];
                            filterLabels[k] = selectedOptions.filter((o: FilterOption) => o.id == current.filterValues[k])[0].label;
                        });
                        displayRows[key] = {
                            areaLabel,
                            areaHierarchy,
                            ...filterLabels,
                        }
                    }
                    const {value, upper, lower} = current
                    const {indicator, format, scale, accuracy} = current.indicatorMeta
                    displayRows[key][indicator] = formatOutput(value, format, scale, accuracy, this.roundFormatOutput);
                    displayRows[key][`${indicator}_lower`] = lower ? formatOutput(lower, format, scale, accuracy, this.roundFormatOutput) : '';
                    displayRows[key][`${indicator}_upper`] = upper ? formatOutput(upper, format, scale, accuracy, this.roundFormatOutput) : '';
                });
                return Object.values(displayRows);
            },
            generatedFields() {
                const fields: any[] = [];
                fields.push({
                    key: 'areaLabel',
                    label: i18next.t('area', {lng: this.currentLanguage})
                })
                this.filtersToDisplay.forEach((value: Filter) => {
                    const field: Dict<any> = {};
                    field.key = value.id
                    field.label = this.translateFilterLabels ? i18next.t(value.label.toLowerCase(), {lng: this.currentLanguage}) : value.label
                    fields.push(field)
                })
                this.indicators.forEach((value: ChoroplethIndicatorMetadata) => {
                    const field: Dict<any> = {};
                    field.key = value.indicator
                    field.label = value.name
                    fields.push(field)
                })
                fields.forEach(field => {
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
