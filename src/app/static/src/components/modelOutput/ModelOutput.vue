<template>
    <div>
        <div class="row">
            <div class="col">
                <ul class="nav nav-tabs col-md-12">
                    <li v-for="tab in tabs" class="nav-item" :key="tab">
                        <a class="nav-link"
                           :class="selectedTab === tab ? 'active' :  ''"
                           v-on:click="tabSelected(tab)" v-translate="tab">
                        </a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="row mt-2">
            <div v-if="selectedTab==='map'" id="choropleth-container" class="col-md-12">
                <choropleth
                    :chartdata="chartdata"
                    :filters="choroplethFilters"
                    :features="features"
                    :feature-levels="featureLevels"
                    :indicators="choroplethIndicators"
                    :selections="choroplethSelections"
                    :include-filters="true"
                    area-filter-id="area"
                    :colour-scales="colourScales"
                    @update="updateOutputChoroplethSelections({payload: $event})"
                    @update-colour-scales="updateOutputColourScales({payload: $event})"></choropleth>
                <div class="row mt-2">
                    <div class="col-md-3"></div>
                    <area-indicators-table class="col-md-9"
                                           :table-data="chartdata"
                                           :area-filter-id="areaFilterId"
                                           :filters="choroplethFilters"
                                           :countryAreaFilterOption="countryAreaFilterOption"
                                           :indicators="filteredChoroplethIndicators"
                                           :selections="choroplethSelections"
                                           :selectedFilterOptions="choroplethSelections.selectedFilterOptions"
                    ></area-indicators-table>
                </div>
            </div>

            <div v-if="selectedTab==='bar'" id="barchart-container" class="col-md-12">
                <bar-chart-with-filters
                    :chart-data="chartdata"
                    :filter-config="barchartFilterConfig"
                    :indicators="barchartIndicators"
                    :selections="barchartSelections"
                    :formatFunction="formatBarchartValue"
                    :showRangesInTooltips="true"
                    :no-data-message="noChartData"
                    @update="updateBarchartSelectionsAndXAxisOrder"></bar-chart-with-filters>
                <div class="row mt-2">
                    <div class="col-md-3"></div>
                    <area-indicators-table class="col-md-9"
                                           :table-data="chartdata"
                                           :area-filter-id="areaFilterId"
                                           :filters="barchartFilters"
                                           :countryAreaFilterOption="countryAreaFilterOption"
                                           :indicators="filteredBarchartIndicators"
                                           :selections="barchartSelections"

                                           :selectedFilterOptions="barchartSelections.selectedFilterOptions"
                    ></area-indicators-table>
                </div>
            </div>

            <div v-if="selectedTab==='bubble'" id="bubble-plot-container" class="col-md-12">
                <bubble-plot :chartdata="chartdata" :features="features" :featureLevels="featureLevels"
                             :filters="bubblePlotFilters" :indicators="bubblePlotIndicators"
                             :selections="bubblePlotSelections"
                             area-filter-id="area"
                             :colour-scales="colourScales"
                             :size-scales="bubbleSizeScales"
                             @update="updateBubblePlotSelections({payload: $event})"
                             @update-colour-scales="updateOutputColourScales({payload: $event})"
                             @update-size-scales="updateOutputBubbleSizeScales({payload: $event})"></bubble-plot>
                <div class="row mt-2">
                    <div class="col-md-3"></div>
                    <area-indicators-table class="col-md-9"
                                           :table-data="chartdata"
                                           :area-filter-id="areaFilterId"
                                           :filters="bubblePlotFilters"
                                           :countryAreaFilterOption="countryAreaFilterOption"
                                           :indicators="filteredBubblePlotIndicators"
                                           :selections="bubblePlotSelections"
                                           :selectedFilterOptions="bubblePlotSelections.selectedFilterOptions"
                    ></area-indicators-table>
                </div>
            </div>

            <div v-if="selectedTab==='comparison'" id="comparison-container" class="col-md-12">
                <bar-chart-with-filters
                    :chart-data="comparisonPlotData"
                    :filter-config="comparisonPlotFilterConfig"
                    :disaggregate-by-config="{ fixed: true, hideFilter: true }"
                    :indicators="comparisonPlotIndicators"
                    :selections="comparisonPlotSelections"
                    :formatFunction="formatBarchartValue"
                    :showRangesInTooltips="true"
                    :no-data-message="noChartData"
                    @update="updateComparisonPlotSelectionsAndXAxisOrder"></bar-chart-with-filters>
                <div class="row mt-2">
                    <div class="col-md-3"></div>
                    <area-indicators-table class="col-md-9"
                                        :table-data="comparisonPlotData"
                                        :area-filter-id="areaFilterId"
                                        :filters="comparisonPlotFilters"
                                        :countryAreaFilterOption="countryAreaFilterOption"
                                        :indicators="filteredComparisonPlotIndicators"
                                        :selections="comparisonPlotSelections"
                                        :translate-filter-labels="false"
                                        :selectedFilterOptions="comparisonPlotSelections.selectedFilterOptions"
                    ></area-indicators-table>
                </div>
                <error-alert v-if="!!comparisonPlotError" :error="comparisonPlotError"></error-alert>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {defineComponent} from "vue";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import BubblePlot from "../plots/bubble/BubblePlot.vue";
    import AreaIndicatorsTable from "../plots/table/AreaIndicatorsTable.vue";
    import {BarchartIndicator, Filter, FilterConfig, FilterOption} from "@reside-ic/vue-charts/src/bar/types";
    import {BarChartWithFilters} from "@reside-ic/vue-charts";
    import ErrorAlert from "../ErrorAlert.vue";

    import {
        mapGettersByNames,
        mapMutationByName,
        mapMutationsByNames,
        mapStateProp,
        mapStateProps,mapActionByName
    } from "../../utils";
    import {
        BarchartSelections,
        BubblePlotSelections,
        ChoroplethSelections, ScaleSelections,
        PlottingSelectionsState, UnadjustedBarchartSelections
    } from "../../store/plottingSelections/plottingSelections";
    import {ModelOutputState} from "../../store/modelOutput/modelOutput";
    import {ModelOutputMutation} from "../../store/modelOutput/mutations";
    import {Feature} from "geojson";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Language, Translations} from "../../store/translations/locales";
    import {inactiveFeatures} from "../../main";
    import {RootState} from "../../root";
    import {LevelLabel} from "../../types";
    import {ChoroplethIndicatorMetadata,} from "../../generated";
    import {
        formatOutput, 
        filterConfig,
        flattenXAxisFilterOptionIds,
        updateSelectionsAndXAxisOrder
    } from "../plots/utils";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
    import i18next from "i18next";

    const namespace = 'filteredData';

    interface Data {
        tabs: string[]
    }

    interface Methods {
        tabSelected: (tab: string) => void
        updateBarchartSelections: (data: { payload: BarchartSelections }) => void
        updateComparisonPlotSelections: (data: { payload: BarchartSelections }) => void
        updateBubblePlotSelections: (data: BubblePlotSelections) => void
        updateOutputColourScales: (colourScales: ScaleSelections) => void
        updateOutputBubbleSizeScales: (colourScales: ScaleSelections) => void
        formatBarchartValue: (value: string | number, indicator: BarchartIndicator) => string
        updateBarchartSelectionsAndXAxisOrder: (data: BarchartSelections) => void
        updateComparisonPlotSelectionsAndXAxisOrder: (data: BarchartSelections) => void
        prepareOutputDownloads: () => void
    }

    interface Computed {
        barchartFilters: Filter[],
        comparisonPlotFilters: Filter[],
        bubblePlotFilters: Filter[],
        choroplethFilters: Filter[],
        countryAreaFilterOption: FilterOption,
        barchartIndicators: BarchartIndicator[],
        comparisonPlotIndicators: BarchartIndicator[],
        chartdata: any,
        comparisonPlotData: any
        barchartSelections: BarchartSelections,
        comparisonPlotSelections: BarchartSelections,
        bubblePlotSelections: BubblePlotSelections,
        choroplethSelections: ChoroplethSelections,
        selectedTab: string,
        features: Feature[],
        featureLevels: LevelLabel[]
        currentLanguage: Language,
        barchartFilterConfig: FilterConfig,
        comparisonPlotFilterConfig: FilterConfig
        colourScales: ScaleSelections,
        bubbleSizeScales: ScaleSelections,
        choroplethIndicators: ChoroplethIndicatorMetadata[],
        bubblePlotIndicators: ChoroplethIndicatorMetadata[],
        filteredChoroplethIndicators: ChoroplethIndicatorMetadata[],
        filteredBarchartIndicators: BarchartIndicator[],
        filteredBubblePlotIndicators: ChoroplethIndicatorMetadata[],
        filteredComparisonPlotIndicators: BarchartIndicator[],
        barchartFlattenedXAxisFilterOptionIds: string[]
        comparisonPlotFlattenedXAxisFilterOptionIds: string[]
        comparisonPlotError: Error | null
        noChartData: string
        comparisonPlotDefaultSelections: UnadjustedBarchartSelections[]
    }

    export default defineComponent<Data, Methods, Computed, unknown>({
        name: "ModelOutput",
        created() {
            if (!this.selectedTab) {
                this.tabSelected(this.tabs[0]);
            }
        },
        data: () => {
            const tabs: (keyof Translations)[] = ["map", "bar"];

            if (!inactiveFeatures.includes("BubblePlot")) {
                tabs.push("bubble");
            }
            tabs.push("comparison");

            return {
                tabs: tabs,
                areaFilterId: "area"
            }
        },
        computed: {
            ...mapGettersByNames("modelOutput", [
                "barchartFilters", "barchartIndicators",
                "bubblePlotFilters", "bubblePlotIndicators",
                "choroplethFilters", "choroplethIndicators",
                "countryAreaFilterOption", "comparisonPlotIndicators",
                "comparisonPlotFilters", "comparisonPlotDefaultSelections"]),
            ...mapStateProps<PlottingSelectionsState, keyof Computed>("plottingSelections", {
                barchartSelections: state => state.barchart,
                comparisonPlotSelections: state => state.comparisonPlot,
                bubblePlotSelections: state => state.bubble,
                choroplethSelections: state => state.outputChoropleth,
                colourScales: state => state.colourScales.output,
                bubbleSizeScales: state => state.bubbleSizeScales.output
            }),
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                    features: state => state.shape!.data.features as Feature[],
                    featureLevels: state => state.shape!.filters.level_labels || []
                }
            ),
            ...mapStateProps<ModelCalibrateState, keyof Computed>("modelCalibrate", {
                comparisonPlotError: state => state.comparisonPlotError
            }),
            filteredChoroplethIndicators() {
                return this.choroplethIndicators.filter((val: ChoroplethIndicatorMetadata) => val.indicator === this.choroplethSelections.indicatorId)
            },
            filteredBarchartIndicators() {
                return this.barchartIndicators.filter((val: BarchartIndicator) => val.indicator === this.barchartSelections.indicatorId)
            },
            filteredBubblePlotIndicators() {
                return [
                    ...this.bubblePlotIndicators.filter((val: ChoroplethIndicatorMetadata) => val.indicator === this.bubblePlotSelections.colorIndicatorId),
                    ...this.bubblePlotIndicators.filter((val: ChoroplethIndicatorMetadata) => val.indicator === this.bubblePlotSelections.sizeIndicatorId)
                ]
            },
            filteredComparisonPlotIndicators() {
                return this.comparisonPlotIndicators.filter((val: BarchartIndicator) => val.indicator === this.comparisonPlotSelections.indicatorId)
            },
            selectedTab: mapStateProp<ModelOutputState, string>("modelOutput", state => state.selectedTab),
            chartdata: mapStateProp<ModelCalibrateState, any>("modelCalibrate", state => {
                return state.result ? state.result.data : [];
            }),
            comparisonPlotData: mapStateProp<ModelCalibrateState, any>("modelCalibrate", state => {
                return state.comparisonPlotResult ? state.comparisonPlotResult.data : [];
            }),
            barchartSelections() {
                return this.$store.state.plottingSelections.barchart
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            barchartFilterConfig() {
                return filterConfig(this.currentLanguage, this.barchartFilters)
            },
            comparisonPlotFilterConfig() {
                return filterConfig(this.currentLanguage, this.comparisonPlotFilters)
            },
            barchartFlattenedXAxisFilterOptionIds() {
                return flattenXAxisFilterOptionIds(this.barchartSelections, this.barchartFilters)
            },
            comparisonPlotFlattenedXAxisFilterOptionIds() {
                return flattenXAxisFilterOptionIds(this.comparisonPlotSelections, this.comparisonPlotFilters)
            },
            noChartData() {
                return i18next.t("noChartData", this.currentLanguage)
            },
        },
        methods: {
            ...mapMutationsByNames<keyof Methods>("plottingSelections",
                ["updateBarchartSelections", "updateComparisonPlotSelections", "updateBubblePlotSelections",
                "updateOutputChoroplethSelections", "updateOutputColourScales", "updateOutputBubbleSizeScales"]),
            tabSelected: mapMutationByName<keyof Methods>("modelOutput", ModelOutputMutation.TabSelected),
            formatBarchartValue: (value: string | number, indicator: BarchartIndicator) => {
                return formatOutput(value, indicator.format, indicator.scale, indicator.accuracy).toString();
            },
            updateBarchartSelectionsAndXAxisOrder(data) {
                updateSelectionsAndXAxisOrder(data, this.barchartSelections, this.barchartFlattenedXAxisFilterOptionIds, this.updateBarchartSelections)
            },
            updateComparisonPlotSelectionsAndXAxisOrder(data) {
                if (data.indicatorId && data.indicatorId !== this.comparisonPlotSelections.indicatorId) {
                    const selections = this.comparisonPlotDefaultSelections
                        .find(selection => selection.indicator_id === data.indicatorId)

                    if (selections) {
                        const comparisonSelections = {
                            indicatorId: selections.indicator_id,
                            xAxisId: selections.x_axis_id,
                            disaggregateById: selections.disaggregate_by_id,
                            selectedFilterOptions: selections.selected_filter_options
                        }
                        this.updateComparisonPlotSelections({payload: comparisonSelections})
                    }

                } else {
                    updateSelectionsAndXAxisOrder(
                        data,
                        this.comparisonPlotSelections,
                        this.comparisonPlotFlattenedXAxisFilterOptionIds,
                        this.updateComparisonPlotSelections)
                }
            },
            prepareOutputDownloads: mapActionByName("downloadResults", "prepareOutputs")
        },
        mounted() {
            this.prepareOutputDownloads();
        },
        components: {
            BarChartWithFilters,
            BubblePlot,
            Choropleth,
            AreaIndicatorsTable,
            ErrorAlert
        }
    })
</script>
