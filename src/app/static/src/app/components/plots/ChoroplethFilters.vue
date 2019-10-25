<template>
    <div v-if="hasFilters">
        <h4>Filters</h4>
        <div class="py-2">
            <filter-select label="Sex"
                           :multiple="false"
                           :options="sexFilters.available"
                           :value="sexFilters.selected"
                           :disabled="sexFilters.disabled"
                           @select="selectSex"></filter-select>
        </div>
        <div class="py-2">
            <filter-select label="Age"
                           :multiple="false"
                           :options="ageFilters.available"
                           :value="ageFilters.selected"
                           :disabled="ageFilters.disabled"
                           @select="selectAge"></filter-select>
        </div>

        <div class="py-2" v-if="!isOutput">
            <filter-select label="Survey"
                           :multiple="false"
                           :options="surveyFilters.available"
                           :value="surveyFilters.selected"
                           :disabled="surveyFilters.disabled"
                           @select="selectSurvey"></filter-select>
        </div>

        <div class="py-2" v-if="!isOutput">
            <filter-select label="Quarter"
                           :multiple="false"
                           :options="quarterFilters.available"
                           :value="quarterFilters.selected"
                           :disabled="quarterFilters.disabled"
                           @select="selectQuarter"></filter-select>
        </div>

        <div class="py-2">
            <filter-select label="Region"
                           :multiple="true"
                           :options="regionFilters.available"
                           :value="regionFilters.selected"
                           :disabled="regionFilters.disabled"
                           @select="selectRegion"></filter-select>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapGetters, mapState} from "vuex";
    import {DataType, FilteredDataState, FilterType} from "../../store/filteredData/filteredData";
    import FilterSelect from "./FilterSelect.vue";
    import {FilterOption} from "../../generated";

    const namespace: string = 'filteredData';

    interface ChoroplethFiltersForType {
        available: FilterOption[],
        selected: string | string[],
        disabled: boolean
    }

    export default Vue.extend({
        name: "ChoroplethFilters",
        computed: {
            ...mapGetters(namespace, ["selectedDataFilterOptions"]),
            ...mapState<FilteredDataState>(namespace, {
                selectedDataType: state => state.selectedDataType,
                selectedChoroplethFilters: state => state.selectedChoroplethFilters,

                sexFilters: function (): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.sex,
                        this.selectedChoroplethFilters.sex)
                },

                ageFilters: function (): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.age,
                        this.selectedChoroplethFilters.age);
                },

                surveyFilters: function (): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.surveys,
                        this.selectedChoroplethFilters.survey);
                },

                quarterFilters: function (): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.quarter,
                        this.selectedChoroplethFilters.quarter);
                },

                regionFilters: function (): ChoroplethFiltersForType {
                    return this.buildRegionFilters();
                },

                hasFilters: function () {
                    return this.selectedChoroplethFilters != null && this.selectedDataFilterOptions != null;
                },

                isOutput: function () {
                    return this.selectedDataType == DataType.Output;
                }
            })
        },
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/choroplethFilterUpdated',
            }),
            buildViewFiltersForType(availableFilterOptions: FilterOption[],
                                    selectedFilterOption?: string) {
                return {
                    available: availableFilterOptions ? availableFilterOptions : [],
                    selected: selectedFilterOption ? selectedFilterOption : null,
                    disabled: availableFilterOptions == undefined
                }
            },
            buildRegionFilters() {
                const selectedRegions = this.selectedChoroplethFilters.regions ?
                    this.selectedChoroplethFilters.regions : [];
                return {
                    available: this.selectedDataFilterOptions.regions,
                    selected: selectedRegions,
                    disabled: false
                }
            },
            selectFilterOption(filterType: FilterType, id: string) {
                this.filterUpdated([filterType, id]);
            },
            selectSex(id: string) {
                this.selectFilterOption(FilterType.Sex, id);
            },
            selectAge(id: string) {
                this.selectFilterOption(FilterType.Age, id);
            },
            selectSurvey(id: string) {
                this.selectFilterOption(FilterType.Survey, id);
            },
            selectQuarter(id: string) {
                this.selectFilterOption(FilterType.Quarter, id);
            },
            selectRegion(ids: string[]) {
                this.filterUpdated([FilterType.Region, ids]);
            },
            getNewSelectedFilterOption(filterName: string, available: FilterOption[]) {
                //if the selected data type has changed, we should update the choropleth filters if the dataset of that
                //type does not include any of the selected filters as values. Set the filter to the first available value
                const currentValue = this.selectedChoroplethFilters[filterName] || null;

                if (available && available.length > 0 //leave unchanged if none available - control will be disabled anyway
                    && ((!currentValue) || available.filter(f => f.id == currentValue).length == 0)) {
                    return available[0].id;
                }
                return null;
            },
            refreshSelectedChoroplethFilters() {
                if (this.hasFilters) {
                    const newSexFilter = this.getNewSelectedFilterOption("sex", this.sexFilters.available);
                    if (newSexFilter) {
                        this.selectSex(newSexFilter);
                    }
                    const newAgeFilter = this.getNewSelectedFilterOption("age", this.ageFilters.available);
                    if (newAgeFilter) {
                        this.selectAge(newAgeFilter);
                    }
                    const newSurveyFilter = this.getNewSelectedFilterOption("survey", this.surveyFilters.available);
                    if (newSurveyFilter) {
                        this.selectSurvey(newSurveyFilter);
                    }
                    const newQuarterFilter = this.getNewSelectedFilterOption("quarter", this.quarterFilters.available);
                    if (newQuarterFilter) {
                        this.selectQuarter(newQuarterFilter);
                    }
                }
            }
        },
        watch: {
            selectedDataType: function () {
                this.refreshSelectedChoroplethFilters();
            }
        },
        created() {
            this.refreshSelectedChoroplethFilters();
        },
        components: {FilterSelect}
    });
</script>