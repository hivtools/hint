<template>
    <div>
        <hr class="my-5"/>
        <h4>Filter current view</h4>
        <div class="py-2">
            <label class="font-weight-bold">Sex</label>
            <treeselect id="sex-filters" :multiple="true"
                        :options="sexFilters.available"
                        :value="sexFilters.selected"
                        :normalizer="treeselectNormalizer"
                        @input="updateSexFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Age</label>
            <treeselect id="age-filters" :multiple="true"
                        :options="ageFilters.available"
                        :value="ageFilters.selected"
                        :normalizer="treeselectNormalizer"
                        @input="updateAgeFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Survey</label>
            <treeselect id="survey-filters" :multiple="true"
                        :options="surveyFilters.available"
                        :value="surveyFilters.selected"
                        :normalizer="treeselectNormalizer"
                        @input="updateSurveyFilter"></treeselect>
        </div>
        <div class="py-2">
            <label class="font-weight-bold">Region</label>
            <treeselect id="region-filters" :multiple="true"
                        :options="regionFilters.available"
                        :value="regionFilters.selected"
                        :normalizer="treeselectNormalizer"
                        @input="updateRegionFilter"></treeselect>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilteredDataState, FilterType} from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';
    import {FilterOption, NestedFilterOption} from "../generated";

    const namespace: string = 'filteredData';

    export interface FiltersForType {
        available: FilterOption[],
        selected: string[]
    }

    export default Vue.extend({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            selectedDataFilterOptions: function () {
                return this.$store.getters['filteredData/selectedDataFilterOptions']
            },
            regionOptions: function () {
                return this.$store.getters['filteredData/regionOptions']
            },

            sexFilters: function (state): FiltersForType {
                const available = (state.selectedDataType == DataType.ANC ?
                    [{id: "female", name: "female"}] :
                    [
                        {id: "female", name: "female"},
                        {id: "male", name: "male"},
                        {id: "both", name: "both"}
                    ]) as FilterOption[];
                return this.buildViewFiltersForType(available, state.selectedFilters.sex)
            },

            ageFilters: function (state): FiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.age,
                    state.selectedFilters.age);
            },

            surveyFilters: function (state): FiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.surveys,
                    state.selectedFilters.surveys);
            },

            regionFilters: function (state): FiltersForType {
                return this.buildViewFiltersForType(this.regionOptions,
                    state.selectedFilters.region);
            }
        }),
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/filterUpdated',
            }),
            treeselectNormalizer(anyNode: any) {
                //In the nested case, this gets called for the child nodes we add in below - just return these unchanged
                if (anyNode.label) {
                    return anyNode;
                }

                const node = anyNode as NestedFilterOption;
                const result = {id: node.id, label: node.name};
                if (node.options) {
                    if (node.options && node.options.length > 0) {
                        (result as any).children = node.options.map(o => this.treeselectNormalizer(o));
                    }
                }
                return result;
            },
            buildViewFiltersForType(availableFilterOptions: FilterOption[],
                                    selectedFilterOptions: FilterOption[]) {
                return {
                    available: availableFilterOptions,
                    selected: (selectedFilterOptions || []).map(f => f.id),
                }
            },
            updateFilter(filterType: FilterType, ids: string[], available: NestedFilterOption[]) {

                //recursively find multiple ids in the available FilterOptions tree in a single pass.
                //Mutates ids and found arrays.
                const findIds = (ids: string[], options: NestedFilterOption[], found: NestedFilterOption[]) => {
                    for (const option of options) {
                        if (ids.length == 0) {
                            break;
                        }

                        const index = ids.indexOf(option.id);
                        if (index > -1) {
                            ids.splice(index, 1); //remove index from array
                            found.push(option);
                        }
                        if (ids.length > 0 && option.options) {
                            findIds(ids, option.options as NestedFilterOption[], found)
                        }
                    }
                };

                const idsToFind = [...ids];
                const found: NestedFilterOption[] = [];
                findIds(idsToFind, available, found);
                this.filterUpdated([filterType, found]);
            },
            updateSexFilter(ids: string[]) {
                this.updateFilter(FilterType.Sex, ids, this.sexFilters.available);
            },
            updateAgeFilter(ids: string[]) {
                this.updateFilter(FilterType.Age, ids, this.ageFilters.available);
            },
            updateSurveyFilter(ids: string[]) {
                this.updateFilter(FilterType.Survey, ids, this.surveyFilters.available);
            },
            updateRegionFilter(ids: string[]) {
                this.updateFilter(FilterType.Region, ids, this.regionFilters.available);
            }
        },
        components: {Treeselect}
    });
</script>