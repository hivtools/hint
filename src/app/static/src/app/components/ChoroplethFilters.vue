<template>
    <div>
        <hr class="my-5"/>
        <h4>Filter map</h4>
        <div class="py-2">
            <filter-select label="Sex"
                    :options="sexFilters.available"
                    :value="sexFilters.selected"
                    :disabled="sexFilters.disabled"
                    @select="selectSex"></filter-select>
        </div>
        <div class="py-2">
            <filter-select label="Age"
                    :options="ageFilters.available"
                    :value="ageFilters.selected"
                    :disabled="ageFilters.disabled"
                    @select="selectAge"></filter-select>
        </div>
        <div class="py-2">
            <filter-select label="Survey"
                    :options="surveyFilters.available"
                    :value="surveyFilters.selected"
                    :disabled="surveyFilters.disabled"
                    @select="selectSurvey"></filter-select>
        </div>
        <div class="py-2">
            <filter-select label="Region"
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
    import {
        DataType,
        FilteredDataState,
        FilterType
    } from "../store/filteredData/filteredData";
    import FilterSelect from "./FilterSelect.vue";
    import {FilterOption} from "../generated";

    const namespace: string = 'filteredData';

    interface ChoroplethFiltersForType {
        available: FilterOption[],
        selected: string
    }

    export default Vue.extend({
        name: "ChoroplethFilters",
        computed: {
            ...mapGetters(namespace, ["selectedDataFilterOptions", "flattenedRegionOptions"]),
            ...mapState<FilteredDataState>(namespace, {
                selectedDataType: state => state.selectedDataType,
                selectedChoroplethFilters: state => state.selectedChoroplethFilters,
                sexFilters: function (state): ChoroplethFiltersForType {
                   return this.buildViewFiltersForType(this.selectedDataFilterOptions.sex,
                       this.selectedChoroplethFilters.sex)
                },

                ageFilters: function (state): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.age,
                        this.selectedChoroplethFilters.age);
                },

                surveyFilters: function (state): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.surveys,
                        this.selectedChoroplethFilters.survey);
                },

                regionFilters: function (state): ChoroplethFiltersForType {
                    return this.buildViewFiltersForType(this.selectedDataFilterOptions.regions,
                        this.selectedChoroplethFilters.region);
                }
            })
        },
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/choroplethFilterUpdated',
            }),
            buildViewFiltersForType(availableFilterOptions: FilterOption[],
                                    selectedFilterOption?: FilterOption) {
                return {
                    available: availableFilterOptions,
                    selected: selectedFilterOption ? selectedFilterOption.id : null,
                    disabled: availableFilterOptions == undefined
                }
            },
            selectFilterOption(filterType: FilterType, id: string, available: FilterOption[]) {
                const newFilter = available.filter(o => o.id == id)[0];

                this.filterUpdated([filterType, newFilter]);
            },
            selectSex(id: string) {
                this.selectFilterOption(FilterType.Sex, id, this.sexFilters.available);
            },
            selectAge(id: string) {
                this.selectFilterOption(FilterType.Age, id, this.ageFilters.available);
            },
            selectSurvey(id: string) {
                this.selectFilterOption(FilterType.Survey, id, this.surveyFilters.available);
            },
            selectRegion(id: string) {
                const newFilter = this.flattenedRegionOptions[id];
                this.filterUpdated([FilterType.Region, newFilter]);
            },
            getNewSelectedFilterOption(filterName: string, available: FilterOption[]) {
                //if the selected data type has changed, we should update the choropleth filters if the dataset of that
                //type does not include any of the selected filters as values. Set the filter to the first available value
                const selectedChoroplethFilters = this.selectedChoroplethFilters;

                const currentValue = selectedChoroplethFilters[filterName] ?
                    selectedChoroplethFilters[filterName].id : null;

                if (available && available.length > 0 //leave unchanged if none available - control will be disabled anyway
                    && ((!currentValue) || available.filter(f => f.id == currentValue).length == 0)) {
                    return available[0].id;
                }
                return null;
            },
            refreshSelectedChoroplethFilters(){
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

                if (!this.selectedChoroplethFilters.region && this.regionFilters.available) {
                   this.filterUpdated([FilterType.Region, this.regionFilters.available[0]]);
                }
            }
        },
        watch: {
            selectedDataType: function (newVal: DataType) {
                this.refreshSelectedChoroplethFilters();
            }
        },
        created() {
            this.refreshSelectedChoroplethFilters();
        },
        components: {FilterSelect}
    });
</script>