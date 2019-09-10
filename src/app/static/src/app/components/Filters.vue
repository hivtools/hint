<template>
    <div v-if="hasSelectedDataType">
        <div class="container-fluid">
            <div class="row">
                <div class="col">
                    <label>Sex</label>
                    <treeselect id="sex-filters" :multiple="true"
                                :options="sexFilters.available"
                                :value="sexFilters.selected"
                                @input="updateSexFilter"></treeselect>
                </div>
                <div class="col">
                    <label>Age</label>
                    <treeselect id="age-filters" :multiple="true"
                                :options="ageFilters.available"
                                :value="ageFilters.selected"
                                @input="updateAgeFilter"></treeselect>
                </div>
                <div class="col">
                    <label>Survey</label>
                    <treeselect id="age-filters" :multiple="true"
                                :options="surveyFilters.available"
                                :value="surveyFilters.selected"
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

    const namespace: string = 'filteredData';

    const treeselectOptions = (stringOptions: string[]) : TreeselectOption[] => {
        return (stringOptions ? stringOptions : []).map(x => { return {"id": x, "label": x}  });
    };

    interface TreeselectOption {
        id: string,
        label: string
    }

    export interface FilterOptions {
        available: TreeselectOption[],
        selected: string[]
    }

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            hasSelectedDataType: state => state.selectedDataType != null,
            selectedDataFilterOptions: function() {
                return this.$store.getters['filteredData/selectedDataFilterOptions']
            },

            sexFilters: (state) => ({
                available: treeselectOptions(state.selectedDataType == DataType.ANC ?
                    ["female"] :
                    ["female", "male", "both"]),
                selected: state.selectedFilters.sex
            } as FilterOptions),

            ageFilters: function(state) {
                return {
                    available: treeselectOptions(this.selectedDataFilterOptions.age as string[]),
                    selected: state.selectedFilters.age
                } as FilterOptions;
            },

            surveyFilters: function(state) {
                const available = this.selectedDataFilterOptions.surveys || [];
                return {
                    available: treeselectOptions(available),
                    selected: state.selectedFilters.survey
                } as FilterOptions;
            }
        }),
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/filterUpdated',
            }),
            updateSexFilter(value: string[]){
                this.filterUpdated([FilterType.Sex, value]);
            },
            updateAgeFilter(value: string[]){
                this.filterUpdated([FilterType.Age, value]);
            },
            updateSurveyFilter(value: string[]){
                this.filterUpdated([FilterType.Survey, value]);
            }
        },
        components: { Treeselect }
    });
</script>