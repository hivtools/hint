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
            :selections="selections"
            :formatFunction="formatBarchartValue"
            @update="updateBarchartSelections({ payload: $event })"
        ></bar-chart-with-filters> -->
        <p v-if="convertedData.data">This should render</p>
        <div>Filter config: {{JSON.stringify(filterConfig)}}</div>
        <div>Indicators: {{JSON.stringify(indicators)}}</div>
        <div>Selections: {{JSON.stringify(selections)}}</div>
        <div>Data: {{JSON.stringify(chartData)}}</div>
        <bar-chart-with-filters
            :chart-data="chartData"
            :filter-config="filterConfig"
            :indicators="indicators"
            :selections="selections"
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
import { RootState } from "../../root";

const namespace = "modelCalibrate";

    interface Methods {
        formatBarchartValue: (value: string | number, indicator: BarchartIndicator) => string,
        keysToCamel: (value: any) => any
    }

    interface Computed {
        barchartFilters: Filter[],
        barchartIndicators: BarchartIndicator[],
        allData: any,
        shape: any,
        convertedData: any,
        chartData: any,
        filterConfig: any,
        filtersArray: any,
        selections: any,
        indicators: any,
        filteredIndicators: any
    }

export default Vue.extend<unknown, Methods, Computed, unknown>({
    name: "CalibrationResults",
    components: {
        BarChartWithFilters,
    },
    computed: {
        ...mapGettersByNames("modelOutput", [
            "barchartFilters",
            "barchartIndicators",
        ]),
        allData: mapStateProp<ModelCalibrateState, any>(namespace, (state) => {
            // console.log("chart data1", state.chartData);
            if (state.chartData) {
                return state.chartData.data ? state.chartData.data : [];
            } else return [];
        }),
        shape: mapStateProp<RootState, any>("root", (state) => {
            return state.baseline.shape;
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
                filters: this.filtersArray,
            };
        },
        filtersArray() {
            let filters = [
                ...this.convertedData.plottingMetadata.barchart.filters,
            ];

            filters.push({
                id: "dataType", //could be snake case like the column_id, but just distinguishing here
                label: "Data Type",
                column_id: "data_type",
                options: [
                    {id: "spectrum", label: "spectrum"},
                    {id: "unadjusted", label: "unadjusted"},
                    {id: "calibrated", label: "calibrated"}
                    ]
            });

            filters.push({
                id: "spectrumRegionName",
                label: "Spectrum Region Name",
                column_id: "spectrum_region_name",
                options: [{id: "Northern", label: "Northern"}, {id: "Southern", label: "Southern"}]
            });

            return [...filters];
        },
        selections() {
            // return this.convertedData.plottingMetadata.barchart.defaults;
            const defaults = this.convertedData.plottingMetadata.barchart.defaults;
            const data = {
                ...this.convertedData.plottingMetadata.barchart.defaults,
                indicatorId: defaults.indicator_id,
                xAxisId: "spectrumRegionName",//defaults.x_axis_id,
                disaggregateById: "dataType" //defaults.disaggregate_by_id
            };

            data.selectedFilterOptions = {...defaults.selected_filter_options};
            data.selectedFilterOptions["sex"] = [{id:"male", label:"Male"}];
            data.selectedFilterOptions["dataType"] = [
                {id: "spectrum", label: "spectrum"},
                {id: "unadjusted", label: "unadjusted"},
                {id: "calibrated", label: "calibrated"}
             ];
            data.selectedFilterOptions["spectrumRegionName"] =  [
                {id: "Northern", label: "Northern"}, {id: "Southern", label: "Southern"}
            ];

            return data;
            // return this.$store.state.plottingSelections.barchart;
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
        ...mapMutationsByNames("plottingSelections", [
            "updateBarchartSelections",
        ]),
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
            // const toCamel = (s: string): string => {
            //     return s.replace(/([-_][a-z])/gi, ($1: string) => {
            //         return $1.toUpperCase().replace("-", "").replace("_", "");
            //     });
            // };
            // const isArray = function (a: any) {
            //     return Array.isArray(a);
            // };
            // const isObject = function (o: any) {
            //     return (
            //         o === Object(o) && !isArray(o) && typeof o !== "function"
            //     );
            // };
            // if (isObject(o)) {
            //     const n = {};

            //     Object.keys(o).forEach((k: string) => {
            //         n[toCamel(k)] = this.keysToCamel(o[k]) as any;
            //     });

            //     return n;
            // } else if (isArray(o)) {
            //     return o.map((i: any) => {
            //         return this.keysToCamel(i);
            //     });
            // }

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
        console.log("filtersArray", this.filtersArray);
        // console.log("plotting metadata", JSON.stringify(this.convertedData.plottingMetadata));
    },
});
</script>