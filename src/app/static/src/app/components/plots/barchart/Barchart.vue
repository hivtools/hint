<template>
    <div>
        <div v-if="initialised" class="row">
            <div class="col-md-3">
                <div id="indicator-fg" class="form-group">
                    <label class="font-weight-bold">{{indicatorText}}</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="indicators"
                                v-model="indicatorId"
                                :normalizer="normalizeIndicators"></treeselect>
                </div>
                <div id="x-axis-fg" class="form-group">
                    <label class="font-weight-bold">{{xAxisText}}</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="filtersAsOptions"
                                v-model="xAxisId"></treeselect>
                </div>
                <div id="disagg-fg" class="form-group">
                    <label class="font-weight-bold">{{disaggByText}}</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="filtersAsOptions"
                                v-model="disaggregateById"></treeselect>
                </div>
                <hr/>
                <h3>{{filtersText}}</h3>
                <div :id="'filter-' + filter.id" v-for="filter in filters" class="form-group">
                    <filter-select :value="getSelectedFilterOptions(filter.id)"
                                   :is-disaggregate-by="filter.id === selections.disaggregateById"
                                   :is-x-axis="filter.id === selections.xAxisId"
                                   :label="filter.label"
                                   :options="filter.options"
                                   :x-axis-text="xAxisText"
                                   :disagg-by-text="disaggByText"
                                   @input="changeFilter(filter.id, $event)"></filter-select>
                </div>
            </div>
            <div v-if="!!xAxisLabel" id="chart" class="col-md-9">
                <chartjs-bar :chartdata="processedOutputData"
                             :xLabel="xAxisLabel"
                             :yLabel="indicatorLabel"
                             style="width: 100%; height: 100%;"></chartjs-bar>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import ChartjsBar from "./chartjsBar.vue";
    import FilterSelect from "./FilterSelect.vue";
    import {BarchartIndicator, Dict, Filter} from "../../../types";
    import {FilterOption} from "../../../generated";
    import {getProcessedOutputData, toFilterLabelLookup} from "./utils";
    import {BarchartSelections} from "../../../store/plottingSelections/plottingSelections";

    interface Props {
        chartdata: any[],
        filters: Filter[],
        indicators: BarchartIndicator[],
        selections: BarchartSelections
    }

    interface Methods {
        normalizeIndicators: (node: BarchartIndicator) => FilterOption,
        changeSelections: (newSelections: Partial<BarchartSelections>) => void,
        changeFilter: (filterId: any, selectedOptions: any) => void,
        getSelectedFilterOptions: (filterId: string) => FilterOption[],
    }

    interface Computed {
        indicatorId: string,
        xAxisId: string,
        disaggregateById: string,
        xAxisLabel: string,
        indicatorLabel: string,
        filtersAsOptions: FilterOption[]
        indicator: BarchartIndicator
        processedOutputData: any
        xAxisLabels: string[]
        xAxisValues: string[]
        xAxisLabelLookup: { [key: string]: string }
        barLabelLookup: { [key: string]: string }
        initialised: boolean
    }

    const props = {
        chartdata: {
            type: Array
        },
        filters: {
            type: Array
        },
        indicators: {
            type: Array
        },
        selections: {
            type: Object
        },
        indicatorText: {
            type: String,
            default: "Indicator"
        },
        xAxisText: {
            type: String,
            default: "X Axis"
        },
        disaggByText: {
            type: String,
            default: "Disaggregate by"
        },
        filtersText: {
            type: String,
            default: "Filters"
        }
    };

    export default Vue.extend<{}, any, Computed, Props>({
        name: "Barchart",
        props: props,
        computed: {
            indicatorId: {
                get() {
                    return this.selections.indicatorId;
                },
                set(value: string) {
                    this.changeSelections({indicatorId: value});
                }
            },
            xAxisId: {
                get() {
                    return this.selections.xAxisId;
                },
                set(value: string) {
                    this.changeSelections({xAxisId: value});
                }
            },
            disaggregateById: {
              get() {
                  return this.selections.disaggregateById;
                },
                set(value: string) {
                  this.changeSelections({disaggregateById: value});
                }
            },
            xAxisLabel() {
                const filter = this.filtersAsOptions.find((f: FilterOption) => f.id == this.selections.xAxisId);
                return filter ? filter.label : "";
            },
            indicatorLabel() {
              return this.indicator ? this.indicator.name : "";
            },
            xAxisLabels() {
                const options = this.selections.selectedFilterOptions[this.selections.xAxisId];
                return options ? options.map((o: FilterOption) => o.label) : [];
            },
            xAxisValues() {
                const options = this.selections.selectedFilterOptions[this.selections.xAxisId];
                return options ? options.map((o: FilterOption) => o.id) : [];
            },
            barLabelLookup() {
                return toFilterLabelLookup(this.selections.selectedFilterOptions[this.selections.disaggregateById] || []);
            },
            xAxisLabelLookup() {
                return toFilterLabelLookup(this.selections.selectedFilterOptions[this.selections.xAxisId] || []);
            },
            filtersAsOptions() {
                return this.filters.map((f: Filter) => ({id: f.id, label: f.label}))
            },
            processedOutputData() {
                return  this.initialised ? getProcessedOutputData(
                    this.chartdata,
                    this.selections.xAxisId,
                    this.selections.disaggregateById,
                    this.indicator,
                    this.filters,
                    this.selections.selectedFilterOptions,
                    this.barLabelLookup,
                    this.xAxisLabelLookup,
                    this.xAxisLabels,
                    this.xAxisValues) : {};
            },
            indicator() {
                return this.indicators.find((i: BarchartIndicator) => i.indicator == this.selections.indicatorId)
            },
            initialised() {
                const unsetFilters = this.filters.filter((f:Filter) => !this.selections.selectedFilterOptions[f.id]);
                return !!this.selections.indicatorId && !!this.selections.xAxisId && !!this.selections.disaggregateById
                    && unsetFilters.length == 0;
            }
        },
        methods: {
            normalizeIndicators(node: BarchartIndicator) {
                return {id: node.indicator, label: node.name};
            },
            changeSelections(newSelections: Partial<BarchartSelections>) {
                this.$emit("update", newSelections)
            },
            changeFilter(filterId: any, selectedOptions: any) {
                const newSelectedFilterOptions = {...this.selections.selectedFilterOptions};
                newSelectedFilterOptions[filterId] = selectedOptions;
                this.changeSelections({...this.selections, selectedFilterOptions: newSelectedFilterOptions});
            },
            getSelectedFilterOptions(filterId: string) {
                return (this.selections.selectedFilterOptions[filterId]) || [];
            }
        },
        created() {
            //If selections have not been initialised, refresh them, and emit changed events
            if (!this.selections.indicatorId) {
                this.indicatorId = this.indicators[0].indicator;
            }

            if (!this.selections.xAxisId) {
                this.xAxisId = this.filters[0].id;
            }

            if (!this.selections.disaggregateById ) {
                this.disaggregateById = this.filters[1].id;
            }

            if (Object.keys(this.selections.selectedFilterOptions).length < 1) {
                const defaultSelected = this.filters.reduce((obj: any, current: Filter) => {
                    obj[current.id] = [current.options[0]];
                    return obj;
                }, {} as Dict<FilterOption[]>);
                this.changeSelections({selectedFilterOptions: defaultSelected});
            }
        },
        components: {
            ChartjsBar,
            Treeselect,
            FilterSelect
        }
    });
</script>