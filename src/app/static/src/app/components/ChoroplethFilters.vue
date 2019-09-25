<template>
    <div>
        <hr class="my-5"/>
        <h4>Filter map</h4>
        <div class="py-2">
            <label class="font-weight-bold">Sex</label>
            <treeselect id="sex-filters" :multiple="false"
                        :clearable="false"
                        :options="sexFilters.available"
                        :value="sexFilters.selected"
                        :normalizer="treeselectNormalizer"
                        :disabled="sexFilters.disabled"
                        @input="updateSexFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Age</label>
            <treeselect id="age-filters" :multiple="false"
                        :clearable="false"
                        :options="ageFilters.available"
                        :value="ageFilters.selected"
                        :normalizer="treeselectNormalizer"
                        :disabled="ageFilters.disabled"
                        @input="updateAgeFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Survey</label>
            <treeselect id="survey-filters" :multiple="false"
                        :clearable="false"
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
    import {FilterOption} from "../generated";

    const namespace: string = 'filteredData';

    interface ChoroplethFiltersForType {
        available: FilterOption[],
        selected: string
    }

    const sexFilterOptions = [
        {id: "both", name: "both"},
        {id: "female", name: "female"},
        {id: "male", name: "male"}
    ];

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
                    [
                        {"id": "female", "name": "female"}
                    ] :
                    sexFilterOptions) as FilterOption[];
                return this.buildViewFiltersForType(available, this.selectedChoroplethFilters.sex)
            },

            ageFilters: function (state): ChoroplethFiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.age,
                    this.selectedChoroplethFilters.age);
            },

            surveyFilters: function (state): ChoroplethFiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.surveys,
                    this.selectedChoroplethFilters.survey);
            }
        }),
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/choroplethFilterUpdated',
            }),
            treeselectNormalizer(anyNode: any) {
                const node = anyNode as FilterOption;
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
            updateFilter(filterType: FilterType, id: string, available: FilterOption[]) {
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
            },
            refreshSelectedChoroplethFilters(){
                //if the selected data type has changed, we should update the choropleth filters if the dataset of that
                //type does not include any of the selected filters as values. Set the filter to the first available value
                const selectedChoroplethFilters = this.selectedChoroplethFilters;

                const getNewFilter = function(filterName: string, available: FilterOption[]) {
                    const currentValue = selectedChoroplethFilters[filterName] ?
                                            selectedChoroplethFilters[filterName].id : null;

                    if (available && available.length > 0 //leave unchanged if none available - control will be disabled anyway
                        && ((!currentValue) || available.filter(f => f.id == currentValue).length == 0)) {
                        return available[0].id;
                    }
                    return null;
                };

                const newSexFilter = getNewFilter("sex", this.sexFilters.available);
                if (newSexFilter) {
                    this.updateSexFilter(newSexFilter);
                }
                const newAgeFilter = getNewFilter("age", this.ageFilters.available);
                if (newAgeFilter) {
                    this.updateAgeFilter(newAgeFilter);
                }
                const newSurveyFilter = getNewFilter("survey", this.surveyFilters.available);
                if (newSurveyFilter) {
                    this.updateSurveyFilter(newSurveyFilter);
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
        components: {Treeselect}
    });
</script>