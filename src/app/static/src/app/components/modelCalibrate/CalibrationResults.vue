<template>
    <div>
        <hr />
        <h3>Review calibration results</h3>
        <p class="text-muted">
            Comparison of unadjusted estimates (uncalibrated) to model estimates
            calibrated to spectrum results as specified in calibration options
            above. ​
        </p>
        <!-- <bar-chart-with-filters
            :chart-data="allData.data"
            :filter-config="allData.plottingMetadata.barchart"
            :indicators="allData.plottingMetadata.barchart.indicators"
            :selections="allData.plottingMetadata.barchart.defaults"
            :formatFunction="formatBarchartValue"
        ></bar-chart-with-filters> -->
        <p v-if="convertedData.data">This should render</p>
        <bar-chart-with-filters
            v-if="convertedData.data"
            :chart-data="convertedData.data"
            :filter-config="filterConfig"
            :indicators="convertedData.plottingMetadata.barchart.indicators"
            :selections="convertedData.plottingMetadata.barchart.defaults"
            :formatFunction="formatBarchartValue"
        ></bar-chart-with-filters>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { BarchartIndicator, Filter } from "@reside-ic/vue-charts/src/bar/types";
import {
    BarChartWithFilters,
    FilterConfig,
    FilterOption,
} from "@reside-ic/vue-charts";
import {
    mapGettersByNames,
    mapMutationByName,
    mapMutationsByNames,
    mapStateProp,
    mapStateProps,
} from "../../utils";
import { ModelCalibrateState } from "../../store/modelCalibrate/modelCalibrate";
import { formatOutput } from "../plots/utils";

const namespace = "modelCalibrate";

export default Vue.extend({
    name: "CalibrationResults",
    components: {
        BarChartWithFilters,
    },
    computed: {
        allData: mapStateProp<ModelCalibrateState, any>(namespace, (state) => {
            // console.log("chart data1", state.chartData);
            if (state.chartData) {
                return state.chartData.data ? state.chartData.data : [];
            } else return [];
        }),
        convertedData() {
            return this.allData.data ? this.keysToCamel(this.allData) : [];
        },
        chartData() {
            return this.convertedData.data;
        },
        filterConfig() {
            return {
                filterLabel: "filters",
                indicatorLabel: "indicator",
                xAxisLabel: "xaxis",
                disaggLabel: "disagg",
                // filters: this.convertedData.plottingMetadata.barchart.filters,
                filters: this.filtersObject
            };
        },
        filtersObject(){
            return [{"id":"spectrumRegion","columnId":"spectrumRegionCode","label":"Area","options":[{"id":"0","label":"Northern"},{"id":"1","label":"Southern"}]},{"id":"quarter","columnId":"calendarQuarter","label":"Period","options":[{"id":"CY2018Q4","label":"December 2018"},{"id":"CY2016Q1","label":"March 2016"}]},{"id":"sex","columnId":"sex","label":"Sex","options":[{"id":"male","label":"Male"},{"id":"female","label":"Female"}]},{"id":"age","columnId":"ageGroup","label":"Age","options":[{"id":"Y000_004","label":"0-4"},{"id":"Y005_009","label":"5-9"},{"id":"Y010_014","label":"10-14"}]}]

        },
        selections() {
            // return this.convertedData.plottingMetadata.barchart.defaults;
            const data = this.convertedData.plottingMetadata.barchart.defaults;
            data.disaggregateById = "dataType";
            data.xAxisId = "spectrumRegionCode"
            return data
        },
        indicators() {
            return this.convertedData.plottingMetadata.barchart.indicators;
        },
        filteredIndicators() {
            // if (this.indicators) {
                return this.indicators.filter(
                    (val: BarchartIndicator) =>
                        val.indicator === this.selections.indicatorId
                );
            // } else return this.indicators;
        },
    },
    methods: {
        formatBarchartValue: (
            value: string | number,
            indicator: BarchartIndicator
        ) => {
            return formatOutput(
                value,
                indicator.format,
                indicator.scale,
                indicator.accuracy
            ).toString();
        },
        keysToCamel(o: any) {
            const toCamel = (s: any): any => {
                return s.replace(/([-_][a-z])/gi, ($1: any) => {
                    return $1.toUpperCase().replace("-", "").replace("_", "");
                });
            };
            const isArray = function (a: any) {
                return Array.isArray(a);
            };
            const isObject = function (o: any) {
                return (
                    o === Object(o) && !isArray(o) && typeof o !== "function"
                );
            };
            if (isObject(o)) {
                const n = {};

                Object.keys(o).forEach((k: any) => {
                    n[toCamel(k)] = this.keysToCamel(o[k]);
                });

                return n;
            } else if (isArray(o)) {
                return o.map((i: any) => {
                    return this.keysToCamel(i);
                });
            }

            return o;
        },
    },
    mounted() {
        // console.log("to camel", this.keysToCamel({ test_one: "test", test_two_three: [{test_four: "test"}] }));
        console.log("alldata", this.allData);
        console.log("convertedData", this.convertedData);
        // console.log("chart should appear", this.convertedData.data ? true : false);
        console.log("chartData", this.chartData);
        console.log("indicators", this.indicators);
        console.log("filtered indicators", this.filteredIndicators);
        console.log("filterConfig", this.filterConfig);
        console.log("selections", this.selections);
        console.log("filtersObject", this.filtersObject);
    },
});
</script>