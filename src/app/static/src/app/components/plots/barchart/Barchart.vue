
<template>
    <div>
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label class="font-weight-bold">Indicator</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="indicators"
                                v-model=indicatorId
                                :normalizer="normalizeIndicators"></treeselect>
                </div>
                <div class="form-group">
                    <label class="font-weight-bold">X Axis</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="filtersAsOptions"
                                v-model=xAxisId></treeselect>
                </div>
                <div class="form-group">
                    <label class="font-weight-bold">Disaggregate by</label>
                    <treeselect :multiple=false
                                :clearable="false"
                                :options="filtersAsOptions"
                                v-model=disaggregateById></treeselect>
                </div>
                <hr/>
                <h3>Filters</h3>
                <div v-for="filter in filters" class="form-group">
                    <filter-select v-model="selectedFilterOptions[filter.id]"
                                   :is-disaggregate-by="filter.id === disaggregateById"
                                   :is-x-axis="filter.id === xAxisId"
                                   :label="filter.label"
                                   :options="filter.options"></filter-select>
                </div>
            </div>
            <div class="col-md-9">
                <chartjs-bar :chartdata="processedOutputData" :xLabel="xAxisLabel" :yLabel="indicator.name" style="width: 100%; height: 100%;"></chartjs-bar>
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

    interface Props {
        chartdata: any[],
        filters: Filter[],
        indicators: BarchartIndicator[]
    }

    interface Data {
        indicatorId: string,
        xAxisId: string,
        disaggregateById: string,
        selectedFilterOptions:  { [key: string]: FilterOption[] }
    }

    interface Computed {
        xAxisLabel: string,
        filtersAsOptions: FilterOption[]
        indicator: BarchartIndicator
        processedOutputData: any
        xAxisLabels: string[]
        xAxisValues: string[]
        xAxisLabelLookup: { [key: string]: string }
        barLabelLookup: { [key: string]: string }
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
        }
    };

    export default Vue.extend<Data, any, Computed, Props>({
        name: "Barchart",
        props: props,
        data: function() {
            const xAxisId = this.filters[0].id;
            const disaggregateById = this.filters[1].id;

            const selectedFilterOptions = this.filters.reduce((obj, current) => {
                    obj[current.id] = [current.options[0]];
                    return obj;
                }, {} as Dict<FilterOption[]>);

            return {
                indicatorId: this.indicators[0].indicator,
                xAxisId,
                disaggregateById,
                selectedFilterOptions
            }
        },
        computed: {
            xAxisLabel() {
                return this.filtersAsOptions.find((f: FilterOption) => f.id == this.xAxisId).label;
            },
            xAxisLabels() {
                return this.selectedFilterOptions[this.xAxisId].map((o: FilterOption) => o.label);
            },
            xAxisValues() {
                return this.selectedFilterOptions[this.xAxisId].map((o: FilterOption) => o.id);
            },
            barLabelLookup() {
                return toFilterLabelLookup(this.selectedFilterOptions[this.disaggregateById]);
            },
            xAxisLabelLookup() {
                return toFilterLabelLookup(this.selectedFilterOptions[this.xAxisId]);
            },
            filtersAsOptions() {
                return this.filters.map((f: Filter) => ({id: f.id, label: f.label}))
            },
            processedOutputData() {
                return getProcessedOutputData(
                    this.chartdata,
                    this.xAxisId,
                    this.disaggregateById,
                    this.indicator,
                    this.filters,
                    this.selectedFilterOptions,
                    this.barLabelLookup,
                    this.xAxisLabelLookup,
                    this.xAxisLabels,
                    this.xAxisValues)
            },
            indicator() {
                return this.indicators.find((i: BarchartIndicator) => i.indicator == this.indicatorId)
            }
        },
        methods: {
            normalizeIndicators(node: BarchartIndicator) {
                return {id: node.indicator, label: node.name};
            }
        },
        components: {
            ChartjsBar,
            Treeselect,
            FilterSelect
        }
    });
</script>