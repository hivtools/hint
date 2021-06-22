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
        <!-- <p v-if="convertedData.data">This should render</p>
        <div>Filter config: {{JSON.stringify(filterConfig)}}</div>
        <div>Indicators: {{JSON.stringify(indicators)}}</div>
        <div>Selections: {{JSON.stringify(selections)}}</div>
        <div>Data: {{JSON.stringify(chartData)}}</div> -->
        <bar-chart-with-filters
            :chart-data="chartData"
            :filter-config="filterConfig"
            :indicators="indicators"
            :selections="selections"
            :formatFunction="formatBarchartValue"
            @update="updateCalibratePlotSelections({ payload: $event })"
        ></bar-chart-with-filters>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import i18next from "i18next";
import { Language, Translations } from "../../store/translations/locales";
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
import {
    PlottingSelectionsState,
    BarchartSelections,
} from "../../store/plottingSelections/plottingSelections";
import { ModelCalibrateState } from "../../store/modelCalibrate/modelCalibrate";
import { formatOutput } from "../plots/utils";
import { RootState } from "../../root";
import { PayloadWithType } from "../../types";

const namespace = "modelCalibrate";

interface Methods {
    updateCalibratePlotSelections: (data: {
        payload: BarchartSelections;
    }) => void;
    formatBarchartValue: (
        value: string | number,
        indicator: BarchartIndicator
    ) => string;
    // keysToCamel: (value: any) => any
}

interface Computed {
    barchartFilters: Filter[];
    barchartIndicators: BarchartIndicator[];
    calibratePlotDefaultSelections: any;
    allData: any;
    shape: any;
    // convertedData: any,
    chartData: any;
    filterConfig: any;
    filters: any;
    selections: any;
    indicators: any;
    filteredIndicators: any;
    currentLanguage: Language;
}

export default Vue.extend<unknown, Methods, Computed, unknown>({
    name: "CalibrationResults",
    components: {
        BarChartWithFilters,
    },
    computed: {
        ...mapGettersByNames(namespace, ["indicators", "filters"]),
        ...mapGettersByNames("plottingSelections", [
            "calibratePlotDefaultSelections",
        ]),
        ...mapStateProps<PlottingSelectionsState, keyof Computed>(
            "plottingSelections",
            {
                selections: (state) => state.calibratePlot,
            }
        ),
        allData: mapStateProp<ModelCalibrateState, any>(namespace, (state) => {
            // console.log("chart data1", state.chartData);
            // if (state.calibratePlotResult) {
            return state.calibratePlotResult ? state.calibratePlotResult : [];
            // } else return [];
        }),
        shape: mapStateProp<RootState, any>("root", (state) => {
            return state.baseline.shape;
        }),
        chartData: mapStateProp<ModelCalibrateState, any>(
            namespace,
            (state) => {
                return state.calibratePlotResult
                    ? state.calibratePlotResult.data
                    : [];
            }
        ),
        filterConfig() {
            return {
                filterLabel: i18next.t("filters", this.currentLanguage),
                indicatorLabel: i18next.t("indicator", this.currentLanguage),
                xAxisLabel: i18next.t("xAxis", this.currentLanguage),
                disaggLabel: i18next.t("disaggBy", this.currentLanguage),
                // filters: this.convertedData.plottingMetadata.barchart.filters,
                filters: this.filters,
            };
        },
        selections() {
            // const defaults = this.allData.plottingMetadata.barchart.defaults;
            // const data = {
            //     ...this.allData.plottingMetadata.barchart.defaults,
            //     indicatorId: defaults.indicator_id,
            //     xAxisId: "spectrumRegionName", //defaults.x_axis_id,
            //     disaggregateById: "dataType", //defaults.disaggregate_by_id
            // };

            // data.selectedFilterOptions = {
            //     ...defaults.selected_filter_options,
            // };
            // data.selectedFilterOptions["sex"] = [{ id: "male", label: "Male" }];
            // data.selectedFilterOptions["dataType"] = [
            //     { id: "spectrum", label: "spectrum" },
            //     { id: "unadjusted", label: "unadjusted" },
            //     { id: "calibrated", label: "calibrated" },
            // ];
            // data.selectedFilterOptions["spectrumRegionName"] = [
            //     { id: "Northern", label: "Northern" },
            //     { id: "Southern", label: "Southern" },
            // ];

            // return data;
            return this.$store.state.plottingSelections.calibratePlot;
        },
        filteredIndicators() {
            // if (this.indicators) {
            return this.indicators.filter(
                (val: BarchartIndicator) =>
                    val.indicator === this.selections.indicatorId
            );
            // } else return this.indicators;
        },
        currentLanguage: mapStateProp<RootState, Language>(
            null,
            (state: RootState) => state.language
        ),
    },
    methods: {
        ...mapMutationsByNames("plottingSelections", [
            "updateCalibratePlotSelections",
        ]),
        formatBarchartValue: (
            value: string | number,
            indicator: BarchartIndicator
        ) => {
            console.log("format barchart indicator", value, indicator)
            return formatOutput(
                value,
                indicator.format,
                indicator.scale,
                indicator.accuracy
            ).toString();
        },
    },
    mounted() {
        // const defaults = this.allData.plottingMetadata.barchart.defaults;
        const data: BarchartSelections = {
            ...this.calibratePlotDefaultSelections,
            indicatorId: this.calibratePlotDefaultSelections.indicator_id,
            xAxisId: "spectrumRegionName", //defaults.x_axis_id,
            disaggregateById: "dataType", //defaults.disaggregate_by_id
        };

        data.selectedFilterOptions = {
            ...this.calibratePlotDefaultSelections.selected_filter_options,
        };
        data.selectedFilterOptions["sex"] = [{ id: "male", label: "Male" }];
        data.selectedFilterOptions["dataType"] = [
            { id: "spectrum", label: "spectrum" },
            { id: "unadjusted", label: "unadjusted" },
            { id: "calibrated", label: "calibrated" },
        ];
        data.selectedFilterOptions["spectrumRegionName"] = [
            { id: "Northern", label: "Northern" },
            { id: "Southern", label: "Southern" },
        ];
        this.updateCalibratePlotSelections({ payload: data });
        // this.updateCalibratePlotSelections(data);
        // console.log("to camel", this.keysToCamel({ test_one: "test", test_two_three: [{test_four: "test"}] }));
        console.log("alldata", this.allData);
        // console.log("convertedData", this.convertedData);
        // console.log("chart should appear", this.convertedData.data ? true : false);
        console.log("chartData", this.chartData);
        console.log("indicators", this.indicators);
        console.log("filtered indicators", this.filteredIndicators);
        console.log("filterConfig", this.filterConfig);
        console.log("selections", this.selections);
        console.log("filters", this.filters);
        // console.log("plotting metadata", JSON.stringify(this.convertedData.plottingMetadata));
    },
});
</script>