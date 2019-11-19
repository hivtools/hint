
<template>
    <div>
        <div v-if="initialised" class="row">
            <div class="col-md-3">
                <div id="indicator-fg" class="form-group">
                    <label class="font-weight-bold">Indicator</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="indicators"
                                :value=selections.indicatorId
                                @input="changeIndicatorId"
                                :normalizer="normalizeIndicators"></treeselect>
                </div>
                <div id="x-axis-fg" class="form-group">
                    <label class="font-weight-bold">X Axis</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="filtersAsOptions"
                                :value=selections.xAxisId
                                @input="changeXAxisId"></treeselect>
                </div>
                <div id="disagg-fg" class="form-group">
                    <label class="font-weight-bold">Disaggregate by</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="filtersAsOptions"
                                :value=selections.disaggregateById
                                @input="changeDisaggById"></treeselect>
                </div>
                <hr/>
                <h3>Filters</h3>
                <div :id="'filter-' + filter.id" v-for="filter in filters" class="form-group">
                    <filter-select :value="getSelectedFilterOptions(filter.id)"
                                   :is-disaggregate-by="filter.id === selections.disaggregateById"
                                   :is-x-axis="filter.id === selections.xAxisId"
                                   :label="filter.label"
                                   :options="filter.options"
                                   @input="changeFilter(filter.id, $event)"></filter-select>
                </div>
            </div>
            <div v-if="!!xAxisLabel" id="chart" class="col-md-9">
                <chartjs-bar :chartdata="processedOutputData" :xLabel="xAxisLabel" :yLabel="indicatorLabel" style="width: 100%; height: 100%;"></chartjs-bar>
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
        changeIndicatorId: (newVal: string) => void;
        changeXAxisId: (newVal: string) => void;
        changeDisaggById: (newVal: string) => void;
    }

    interface Computed {
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
        }
    };

    export default Vue.extend<{}, any, Computed, Props>({
        name: "Barchart",
        props: props,
        computed: {
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
                return !!this.selections.indicatorId && !!this.selections.xAxisId && !!this.selections.disaggregateById;
            }
        },
        methods: {
            normalizeIndicators(node: BarchartIndicator) {
                return {id: node.indicator, label: node.name};
            },
            changeSelections(newSelections: BarchartSelections) {
                this.$emit("change-selections", newSelections)
            },
            changeIndicatorId(newVal: string) {
                this.changeSelections({...this.selections, indicatorId: newVal});
            },
            changeXAxisId(newVal: string) {
                this.changeSelections({...this.selections, xAxisId: newVal});
            },
            changeDisaggById(newVal: string) {
                this.changeSelections({...this.selections, disaggregateById: newVal});
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
            //If selections have not been initialised, refresh them, and emit changed event
            let modified = false;
            const newSelections: BarchartSelections = {...this.selections};

            if (!this.selections.indicatorId) {
                newSelections.indicatorId = this.indicators[0].indicator;
                modified = true;
            }

            if (!this.selections.xAxisId) {
                newSelections.xAxisId = this.filters[0].id;
                modified = true;
            }

            if (!this.selections.disaggregateById ) {
                newSelections.disaggregateById = this.filters[1].id;
                modified = true;
            }

            if (Object.keys(this.selections.selectedFilterOptions).length < 1) {
                const defaultSelected = this.filters.reduce((obj: any, current: Filter) => {
                    obj[current.id] = [current.options[0]];
                    return obj;
                }, {} as Dict<FilterOption[]>);
                newSelections.selectedFilterOptions = defaultSelected;
                modified = true;
            }

            if (modified) {
                this.changeSelections(newSelections);
            }

        },
        components: {
            ChartjsBar,
            Treeselect,
            FilterSelect
        }
    });
</script>