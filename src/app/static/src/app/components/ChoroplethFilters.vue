<template>
    <div>
        <hr class="my-5"/>
        <h4>Filter map</h4>
        <div class="py-2">
            <label class="font-weight-bold">Sex</label>
            <treeselect id="sex-filters" :multiple="false"
                        :options="sexFilters.available"
                        :value="sexFilters.selected"
                        :normalizer="treeselectNormalizer"
                        :disabled="sexFilters.disabled"
                        @input="updateSexFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Age</label>
            <treeselect id="age-filters" :multiple="false"
                        :options="ageFilters.available"
                        :value="ageFilters.selected"
                        :normalizer="treeselectNormalizer"
                        :disabled="ageFilters.disabled"
                        @input="updateAgeFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Survey</label>
            <treeselect id="survey-filters" :multiple="false"
                        :options="surveyFilters.available"
                        :value="surveyFilters.selected"
                        :normalizer="treeselectNormalizer"
                        :disabled="surveyFilters.disabled"
                        @input="updateSurveyFilter"></treeselect>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {
        DataType,
        FilteredDataState,
        FilterType,
        SelectedChoroplethFilters
    } from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';
    import {FilterOption, NestedFilterOption} from "../generated";

    const namespace: string = 'filteredData';

    interface ChoroplethFiltersForType {
        available: FilterOption[],
        selected: string
    }

    export default Vue.extend({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {
            selectedDataType: state => state.selectedDataType,
            selectedChoroplethFilters: state => state.selectedChoroplethFilters,
            selectedDataFilterOptions: function () {
                return this.$store.getters['filteredData/selectedDataFilterOptions']
            },

            sexFilters: function (state): ChoroplethFiltersForType {
                const available = (state.selectedDataType == DataType.ANC ?
                    [{id: "female", name: "female"}] :
                    [
                        {id: "female", name: "female"},
                        {id: "male", name: "male"},
                        {id: "both", name: "both"}
                    ]) as FilterOption[];
                return this.buildViewFiltersForType(available, this.selectedChoroplethFilters.sex)
            },

            ageFilters: function (state): ChoroplethFiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.age,
                    this.selectedChoroplethFilters.age);
            },

            surveyFilters: function (state): ChoroplethFiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.surveys,
                    this.selectedChoroplethFilters.surveys);
            }
        }),
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/choroplethFilterUpdated',
            }),
            treeselectNormalizer(anyNode: any) {
                const node = anyNode as NestedFilterOption;
                return {id: node.id, label: node.name};
            },
            buildViewFiltersForType(availableFilterOptions: FilterOption[],
                                    selectedFilterOption?: FilterOption) {
                return {
                    available: availableFilterOptions,
                    selected: selectedFilterOption ? selectedFilterOption.id : null,
                    disabled: availableFilterOptions == undefined
                }
            },
            updateFilter(filterType: FilterType, id: string, available: NestedFilterOption[]) {
                const newFilter = available.filter(o => o.id == id)[0];

                this.filterUpdated([filterType, newFilter]);
            },
            updateSexFilter(id: string) {
                this.updateFilter(FilterType.Sex, id, this.sexFilters.available);
            },
            updateAgeFilter(id: string) {
                this.updateFilter(FilterType.Age, id, this.ageFilters.available);
            },
            updateSurveyFilter(id: string) {
                this.updateFilter(FilterType.Survey, id, this.surveyFilters.available);
            }
        },
        watch: {
            selectedDataType: function (newVal: DataType) {
                //if the selected data type has changed, we should update the choropleth filters if the dataset of that
                //type does not include any of the selected filters as values. Set the filter to the first available value
                let updatedFilters = {...this.selectedChoroplethFilters} as SelectedChoroplethFilters;
                let availableFilters = this.selectedDataFilterOptions;
                const selectedChoroplethFilters = this.selectedChoroplethFilters;

                const getNewFilter = function(filterName: string, available: FilterOption[]) {
                    if (available  && available.length > 0 //leave unchanged if none - control will be disabled anyway
                        && available.filter(f => f.id == selectedChoroplethFilters[filterName].id).length == 0) {
                        return available[0].id;
                    }
                    return null;
                };

                const newSexFilter = getNewFilter("sex", availableFilters.sexFilters);
                if (newSexFilter) {
                    this.updateSexFilter(newSexFilter);
                }
                const newAgeFilter = getNewFilter("age", availableFilters.ageFilters);
                if (newAgeFilter) {
                    this.updateAgeFilter(newAgeFilter);
                }
                const newSurveyFilter = getNewFilter("survey", availableFilters.surveyFilters);
                if (newSurveyFilter) {
                    this.updateSurveyFilter(newSurveyFilter);
                }

            }
        },
        components: {Treeselect}
    });
</script>