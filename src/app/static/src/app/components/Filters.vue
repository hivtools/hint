<template>
    <div v-if="hasSelectedDataType">
        <div class="container-fluid">
            <div class="row">
                <div class="col">
                    <label>Sex</label>
                    <treeselect id="sex-filters" :multiple="true"
                                :options="sexFilters.available"
                                :value="sexFilters.selected"
                                :normalizer = "treeselectNormalizer"
                                @input="updateSexFilter"></treeselect>
                </div>
                <div class="col">
                    <label>Age</label>
                    <treeselect id="age-filters" :multiple="true"
                                :options="ageFilters.available"
                                :value="ageFilters.selected"
                                :normalizer = "treeselectNormalizer"
                                @input="updateAgeFilter"></treeselect>
                </div>
                <div class="col">
                    <label>Survey</label>
                    <treeselect id="survey-filters" :multiple="true"
                                :options="surveyFilters.available"
                                :value="surveyFilters.selected"
                                :normalizer = "treeselectNormalizer"
                                @input="updateSurveyFilter"></treeselect>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilterType, FilteredDataState} from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';
    import {FilterOption, NestedFilterOption} from "../generated";

    const namespace: string = 'filteredData';

    /*interface TreeselectOption {
        id: string,
        label: string
    }

    interface NestedTreeselectoption extends TreeselectOption {
        children: TreeselectOption[]
    }*/

   /* */

    //TODO: combine these?? if filterOption.children then do nesting
    /*const treeselectOptions = (filterOptions: FilterOption[]) : TreeselectOption[] => {
        return (filterOptions || []).map(x => { return {id: x.id, label: x.name}  });
    };

    const nestedTreeSelectOptions = (nestedOptions: NestedFilterOption[]): TreeselectOption[] => {
        return (nestedOptions ? nestedOptions : [])
            .map(x => {
                if (x.options && x.options.length) {
                    return {
                        id: x.id,
                        label: x.name,
                        children: nestedTreeSelectOptions(x.options as NestedFilterOption[])
                    }
                } else {
                    return {
                        id: x.id,
                        label: x.name
                    }
                }
            });
    };*/


    export interface FiltersForType {
        available: FilterOption[],
        selected: string[]
    }

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            hasSelectedDataType: state => state.selectedDataType != null,
            selectedDataFilterOptions: function() {
                return this.$store.getters['filteredData/selectedDataFilterOptions']
            },

            sexFilters: function(state): FiltersForType{
                const available = (state.selectedDataType == DataType.ANC ?
                    [{id: "female", name: "female"}] :
                    [
                        {id: "female", name: "female"},
                        {id: "male", name: "male"},
                        {id: "both", name: "both"}
                    ]) as FilterOption[];
               return this.buildViewFiltersForType(available, state.selectedFilters.sex)
            },

            ageFilters: function(state): FiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.age,
                    state.selectedFilters.age);
            },

            surveyFilters: function(state): FiltersForType {
                return this.buildViewFiltersForType(this.selectedDataFilterOptions.surveys,
                    state.selectedFilters.surveys);
            }
        }),
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/filterUpdated',
            }),
            treeselectNormalizer(node: FilterOption) {
                return {id: node.id, label: node.name}
            },
            buildViewFiltersForType(availableFilterOptions: FilterOption[],
                                       selectedFilterOptions: FilterOption[]) {
                return {
                    available: availableFilterOptions,
                    selected: (selectedFilterOptions || []).map(f => f.id),
                }
            },
            updateFilter(filterType: FilterType, ids: string[], available: FilterOption[]) {
                const updatedSelected = available.filter(a => ids.indexOf(a.id) > -1);
                this.filterUpdated([filterType, updatedSelected]);

            },
            updateSexFilter(ids: string[]){
                this.updateFilter(FilterType.Sex, ids, this.sexFilters.available);
            },
            updateAgeFilter(ids: string[]){
                this.updateFilter(FilterType.Age, ids, this.ageFilters.available);
            },
            updateSurveyFilter(ids: string[]){
                this.updateFilter(FilterType.Survey, ids, this.surveyFilters.available);
            }
        },
        components: { Treeselect }
    });
</script>