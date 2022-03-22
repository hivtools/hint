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

            <div id="barchart-container" :class="selectedTab==='bar' ? 'col-md-12' : 'd-none'">
                <bar-chart-with-filters
                    :chart-data="chartdata"
                    :filter-config="filterConfig"
                    :indicators="barchartIndicators"
                    :selections="barchartSelections"
                    :formatFunction="formatBarchartValue"
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
        </div>
    </div>
</template>

<script lang="ts">
    import i18next from "i18next";
    import Vue from "vue";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import BubblePlot from "../plots/bubble/BubblePlot.vue";
    import AreaIndicatorsTable from "../plots/table/AreaIndicatorsTable.vue";
    import {BarchartIndicator, Filter, FilterConfig, FilterOption} from "@reside-ic/vue-charts/src/bar/types";
    import {BarChartWithFilters} from "@reside-ic/vue-charts";

    import {
        mapGetterByName,
        mapGettersByNames,
        mapMutationByName,
        mapMutationsByNames,
        mapStateProp,
        mapStateProps,
        flattenOptions, mapActionByName, flattenOptionsIdsByHierarchy
    } from "../../utils";

    import {
        BarchartSelections,
        BubblePlotSelections,
        ChoroplethSelections, ScaleSelections,
        PlottingSelectionsState
    } from "../../store/plottingSelections/plottingSelections";
    import {ModelOutputState} from "../../store/modelOutput/modelOutput";
    import {ModelOutputMutation} from "../../store/modelOutput/mutations";
    import {Feature} from "geojson";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Language, Translations} from "../../store/translations/locales";
    import {inactiveFeatures} from "../../main";
    import {RootState} from "../../root";
    import {LevelLabel, Dict} from "../../types";
    import {ChoroplethIndicatorMetadata, NestedFilterOption} from "../../generated";
    import {formatOutput} from "../plots/utils";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";

    const namespace = 'filteredData';

    interface Data {
        tabs: string[]
    }

    interface Methods {
        tabSelected: (tab: string) => void
        updateBarchartSelections: (data: { payload: BarchartSelections }) => void
        updateBubblePlotSelections: (data: BubblePlotSelections) => void
        updateOutputColourScales: (colourScales: ScaleSelections) => void
        updateOutputBubbleSizeScales: (colourScales: ScaleSelections) => void
        formatBarchartValue: (value: string | number, indicator: BarchartIndicator) => string
        updateBarchartSelectionsAndXAxisOrder: (data: BarchartSelections) => void
        prepareOutputDownloads: () => void
    }

    interface Computed {
        barchartFilters: Filter[],
        bubblePlotFilters: Filter[],
        choroplethFilters: Filter[],
        countryAreaFilterOption: FilterOption,
        barchartIndicators: BarchartIndicator[],
        chartdata: any,
        barchartSelections: BarchartSelections,
        bubblePlotSelections: BubblePlotSelections,
        choroplethSelections: ChoroplethSelections,
        selectedTab: string,
        features: Feature[],
        featureLevels: LevelLabel[]
        currentLanguage: Language,
        filterConfig: FilterConfig,
        colourScales: ScaleSelections,
        bubbleSizeScales: ScaleSelections,
        choroplethIndicators: ChoroplethIndicatorMetadata[],
        bubblePlotIndicators: ChoroplethIndicatorMetadata[],
        filteredChoroplethIndicators: ChoroplethIndicatorMetadata[],
        filteredBarchartIndicators: BarchartIndicator[],
        filteredBubblePlotIndicators: ChoroplethIndicatorMetadata[],
        flattenedXAxisFilterOptionIds: string[]
    }

    export default Vue.extend<Data, Methods, Computed, unknown>({
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

            return {
                tabs: tabs,
                areaFilterId: "area"
            }
        },
        computed: {
            ...mapGettersByNames("modelOutput", [
                "barchartFilters", "barchartIndicators",
                "bubblePlotFilters", "bubblePlotIndicators",
                "choroplethFilters", "choroplethIndicators", "countryAreaFilterOption"]),
            ...mapStateProps<PlottingSelectionsState, keyof Computed>("plottingSelections", {
                barchartSelections: state => state.barchart,
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
            selectedTab: mapStateProp<ModelOutputState, string>("modelOutput", state => state.selectedTab),
            chartdata: mapStateProp<ModelCalibrateState, any>("modelCalibrate", state => {
                return state.result ? state.result.data : [];
            }),
            barchartSelections() {
                return this.$store.state.plottingSelections.barchart
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            filterConfig() {
                return {
                    filterLabel: i18next.t("filters", this.currentLanguage),
                    indicatorLabel: i18next.t("indicator", this.currentLanguage),
                    xAxisLabel: i18next.t("xAxis", this.currentLanguage),
                    disaggLabel: i18next.t("disaggBy", this.currentLanguage),
                    filters: this.barchartFilters
                }
            },
            flattenedXAxisFilterOptionIds() {
                const xAxisId = this.barchartSelections?.xAxisId
                let ids: string[] = []
                if (xAxisId && this.barchartFilters?.length) {
                    const filter = this.barchartFilters.find((f: Filter) => f.id === xAxisId)
                    if (filter?.options.length){
                        ids = flattenOptionsIdsByHierarchy(filter.options)
                    }
                }
                return ids
            }
        },
        methods: {
            ...mapMutationsByNames<keyof Methods>("plottingSelections",
                ["updateBarchartSelections", "updateBubblePlotSelections", "updateOutputChoroplethSelections",
                    "updateOutputColourScales", "updateOutputBubbleSizeScales"]),
            tabSelected: mapMutationByName<keyof Methods>("modelOutput", ModelOutputMutation.TabSelected),
            formatBarchartValue: (value: string | number, indicator: BarchartIndicator) => {
                console.log("formatBarchartValue", formatOutput(value, indicator.format, indicator.scale, indicator.accuracy).toString(), value, indicator)
                return formatOutput(value, indicator.format, indicator.scale, indicator.accuracy).toString();
            },
            updateBarchartSelectionsAndXAxisOrder(data) {
                const payload = {...this.barchartSelections, ...data}
                if (data.xAxisId && data.selectedFilterOptions) {
                    const {xAxisId, selectedFilterOptions} = data
                    if (selectedFilterOptions[xAxisId] && this.flattenedXAxisFilterOptionIds.length) {
                        // Sort the selected filter values according to the order given the barchart filters
                        const updatedFilterOptions = [...selectedFilterOptions[xAxisId]].sort((a: FilterOption, b: FilterOption) => {
                            return this.flattenedXAxisFilterOptionIds.indexOf(a.id) - this.flattenedXAxisFilterOptionIds.indexOf(b.id);
                        });
                        payload.selectedFilterOptions[xAxisId] = updatedFilterOptions
                    }
                }
                // if unable to do the above, just updates the barchart as normal
                this.updateBarchartSelections({payload})
            },
            prepareOutputDownloads: mapActionByName("downloadResults", "prepareOutputs")
        },
        mounted() {
            this.prepareOutputDownloads();
            console.log("mounted", this.barchartIndicators, this.filteredBarchartIndicators, this.chartdata)
        },
        components: {
            BarChartWithFilters,
            BubblePlot,
            Choropleth,
            AreaIndicatorsTable
        }
    })
</script>
