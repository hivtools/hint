<template>
    <div>
        <div class="row">
            <ul class="nav nav-tabs col-12 mb-3">
                <li class="nav-item">
                    <a class="nav-link"
                       :class="{'active': selectedTab === 0}"
                       v-translate="'map'"
                       v-on:click="selectTab(0)"></a>
                </li>
                <li class="nav-item" v-if="anc.available || programme.available">
                    <a class="nav-link"
                       :class="{'active': selectedTab === 1}"
                       v-translate="'timeSeries'"
                       v-on:click="selectTab(1)"></a>
                </li>
            </ul>
        </div>
        <div v-if="selectedTab === 0" class="row">
            <div :class="showChoropleth ? 'col-md-3' : 'col-sm-6 col-md-8'" class="upload-section">
                <div v-if="showChoropleth" id="data-source" class="form-group">
                    <h4 id="data-source-header" v-translate="'dataSource'"></h4>
                    <tree-select
                            :multiple="false"
                            :clearable="false"
                            :options="dataSourceOptions"
                            :value="selectedDataType"
                            @select="selectDataSource">
                    </tree-select>
                </div>
                <filters v-if="showChoropleth"
                         :filters="filters"
                         :selectedFilterOptions="plottingSelections.selectedFilterOptions"
                         @update="updateChoroplethSelections({payload: {selectedFilterOptions: $event}})"></filters>
            </div>
            <div v-if="showChoropleth" class="col-md-9">
                <choropleth :chartdata="data"
                            :filters="filters"
                            :features="features"
                            :feature-levels="featureLevels"
                            :indicators="sapIndicatorsMetadata"
                            :selections="plottingSelections"
                            :include-filters="false"
                            :area-filter-id="areaFilterId"
                            :colour-scales="selectedSAPColourScales"
                            @update="updateChoroplethSelections({payload: $event})"
                            @update-colour-scales="updateSAPColourScales({payload: [selectedDataType, $event]})"></choropleth>
                <div>
                    <table-view :tabledata="data"
                                :area-filter-id="areaFilterId"
                                :filters="filters"
                                :countryAreaFilterOption="countryAreaFilterOption"
                                :indicators="filterTableIndicators"
                                :selections="plottingSelections"
                                :selectedFilterOptions="plottingSelections.selectedFilterOptions"
                    ></table-view>
                </div>
            </div>
        </div>
        <div v-if="selectedTab === 1">
            <generic-chart v-if="genericChartMetadata"
                           chart-id="input-time-series"
                           chart-height="600px"
                           :metadata="genericChartMetadata"></generic-chart>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import TreeSelect from '@riophae/vue-treeselect';
    import i18next from "i18next";
    import {mapGetters, mapMutations, mapState} from "vuex";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import TableView from "../plots/table/Table.vue";
    import Filters from "../plots/Filters.vue";
    import {
        Filter,
        GenericChartMetadataResponse,
        LevelLabel,
        PartialFileUploadProps,
        PayloadWithType
    } from "../../types";
    import {RootState} from "../../root";
    import {DataType, SurveyAndProgramState} from "../../store/surveyAndProgram/surveyAndProgram";
    import {Feature} from "geojson";
    import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
    import {mapActionByName, mapGettersByNames, mapStateProp} from "../../utils";
    import {
        ChoroplethSelections,
        PlottingSelectionsState
    } from "../../store/plottingSelections/plottingSelections";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Language} from "../../store/translations/locales";
    import GenericChart from "../genericChart/GenericChart.vue";
    import {GenericChartState} from "../../store/genericChart/genericChart";

    const namespace = 'surveyAndProgram';

    enum Tab {
        Map = 0,
        TimeSeries = 1
    }

    interface Data {
        areaFilterId: string
        selectedTab: Tab
    }

    interface SAPFileUploadProps extends PartialFileUploadProps {
        available: boolean
    }

    interface Computed {
        selectedDataType: DataType,
        filters: Filter[],
        countryAreaFilterOption: FilterOption,
        data: any,
        sapIndicatorsMetadata: ChoroplethIndicatorMetadata[],
        showChoropleth: boolean,
        anc: SAPFileUploadProps,
        programme: SAPFileUploadProps,
        survey: SAPFileUploadProps,
        features: Feature[],
        featureLevels: LevelLabel[],
        plottingSelections: ChoroplethSelections,
        selectedDataSource: string,
        filterTableIndicators: ChoroplethIndicatorMetadata[],
        currentLanguage: Language,
        dataSourceOptions: FilterOption[],
        genericChartMetadata: GenericChartMetadataResponse | null
    }

    interface Methods {
        selectDataType: (payload: DataType) => void,
        selectDataSource: (option: FilterOption) => void,
        selectTab: (tab: Tab) => void
    }

    export default Vue.extend<Data, Methods, Computed, unknown>({
        name: "SurveyAndProgram",
        data: () => {
            return {
                areaFilterId: "area",
                selectedTab: Tab.Map
            };
        },
        computed: {
            ...mapState<RootState>({
                selectedDataType: ({surveyAndProgram}: {surveyAndProgram: SurveyAndProgramState}) => {
                    return surveyAndProgram.selectedDataType;
                },
                showChoropleth: ({surveyAndProgram, baseline}: {surveyAndProgram: SurveyAndProgramState, baseline: BaselineState}) => {
                    return surveyAndProgram.selectedDataType != null;
                },
                anc: ({surveyAndProgram}: {surveyAndProgram: SurveyAndProgramState}) => ({
                    available: !surveyAndProgram.ancError && surveyAndProgram.anc
                }),
                programme: ({surveyAndProgram}: {surveyAndProgram: SurveyAndProgramState}) => ({
                    available: !surveyAndProgram.programError && surveyAndProgram.program
                }),
                survey: ({surveyAndProgram}: {surveyAndProgram: SurveyAndProgramState}) => ({
                    available: !surveyAndProgram.surveyError && surveyAndProgram.survey
                }),
                features: ({baseline} : {baseline: BaselineState}) => baseline.shape ? baseline.shape.data.features : [] as Feature[],
                featureLevels: ({baseline} : {baseline: BaselineState}) => baseline.shape ? baseline.shape.filters.level_labels : [],
                plottingSelections: ({plottingSelections}: {plottingSelections: PlottingSelectionsState}) => plottingSelections.sapChoropleth,
                genericChartMetadata:({genericChart}: {genericChart: GenericChartState}) => genericChart.genericChartMetadata
            }),
            ...mapGettersByNames(namespace, ["data", "filters", "countryAreaFilterOption"]),
            ...mapGetters("metadata", ["sapIndicatorsMetadata"]),
            ...mapGetters("plottingSelections", ["selectedSAPColourScales"]),
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            filterTableIndicators() {
                return this.sapIndicatorsMetadata.filter((val: ChoroplethIndicatorMetadata) => val.indicator === this.plottingSelections.indicatorId)
            },
            dataSourceOptions() {
                const options = [];
                const lang = {lng: this.currentLanguage};
                if (this.survey.available) {
                    options.push({id: "2", label: i18next.t("survey", lang)});
                }
                if (this.programme.available) {
                    options.push({id: "1", label: i18next.t("ART", lang)});
                }
                if (this.anc.available) {
                    options.push({id: "0", label: i18next.t("ANC", lang)});
                }
                return options;
            }
        },
        methods: {
            ...mapMutations({
                updateChoroplethSelections: "plottingSelections/updateSAPChoroplethSelections",
                updateSAPColourScales: "plottingSelections/updateSAPColourScales",
            }),
            selectDataType: mapActionByName(namespace, "selectDataType"),
            selectDataSource: function(option: FilterOption) {
                this.selectDataType(parseInt(option.id))
            },
            selectTab: function(tab: Tab) {
                this.selectedTab = tab
            }
        },
        components: {
            Choropleth,
            Filters,
            TableView,
            TreeSelect,
            GenericChart
        }
    })
</script>
