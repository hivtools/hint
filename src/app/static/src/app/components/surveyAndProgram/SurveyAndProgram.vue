<template>
    <div>
        <div class="row">
            <div :class="showChoropleth ? 'col-md-3' : 'col-sm-6 col-md-8'" class="upload-section">
                <form>
                    <manage-file label="survey"
                                 :valid="survey.valid"
                                 :fromADR="survey.fromADR"
                                 :error="survey.error"
                                 :upload="uploadSurvey"
                                 :delete-file="deleteSurvey"
                                 :existingFileName="survey.existingFileName"
                                 accept="csv,.csv"
                                 name="survey">
                    </manage-file>
                    <manage-file label="ART"
                                 :valid="programme.valid"
                                 :fromADR="programme.fromADR"
                                 :error="programme.error"
                                 :upload="uploadProgram"
                                 :delete-file="deleteProgram"
                                 :existingFileName="programme.existingFileName"
                                 accept="csv,.csv"
                                 name="program">
                    </manage-file>
                    <manage-file label="ANC"
                                 :valid="anc.valid"
                                 :fromADR="anc.fromADR"
                                 :error="anc.error"
                                 :upload="uploadANC"
                                 :delete-file="deleteANC"
                                 :existingFileName="anc.existingFileName"
                                 accept="csv,.csv"
                                 name="anc">
                    </manage-file>
                </form>
                <filters v-if="showChoropleth"
                         :filters="filters"
                         :selectedFilterOptions="plottingSelections.selectedFilterOptions"
                         @update="updateChoroplethSelections({payload: {selectedFilterOptions: $event}})"></filters>
            </div>
            <div v-if="showChoropleth" class="col-md-9">
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link" :class="survey.tabClass" v-on:click="selectTab(2)"
                           v-translate="'survey'"></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" :class="programme.tabClass" v-on:click="selectTab(1)" v-translate="'ART'">ART</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" :class="anc.tabClass" v-on:click="selectTab(0)" v-translate="'ANC'">ANC</a>
                    </li>
                </ul>
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
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import TableView from "../plots/table/Table.vue";
    import Filters from "../plots/Filters.vue";
    import {Filter, LevelLabel, PartialFileUploadProps} from "../../types";
    import {RootState} from "../../root";
    import {DataType} from "../../store/surveyAndProgram/surveyAndProgram";
    import {Feature} from "geojson";
    import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
    import {mapGettersByNames} from "../../utils";
    import {ChoroplethSelections} from "../../store/plottingSelections/plottingSelections";
    import ManageFile from "../files/ManageFile.vue";

    const namespace = 'surveyAndProgram';

    interface Data {
        areaFilterId: string
    }

    interface Computed {
        selectedDataType: DataType,
        filters: Filter[],
        countryAreaFilterOption: FilterOption,
        data: any,
        sapIndicatorsMetadata: ChoroplethIndicatorMetadata[],
        showChoropleth: boolean,
        anc: PartialFileUploadProps,
        programme: PartialFileUploadProps,
        survey: PartialFileUploadProps,
        features: Feature[],
        featureLevels: LevelLabel[],
        plottingSelections: ChoroplethSelections,
        filterTableIndicators: ChoroplethIndicatorMetadata[]
    }

    export default Vue.extend<Data, unknown, Computed, unknown>({
        name: "SurveyAndProgram",
        data: () => {
            return {
                areaFilterId: "area"
            };
        },
        computed: {
            ...mapState<RootState>({
                selectedDataType: ({surveyAndProgram}) => {
                    return surveyAndProgram.selectedDataType;
                },
                showChoropleth: ({surveyAndProgram, baseline}) => {
                    return surveyAndProgram.selectedDataType != null;
                },
                anc: ({surveyAndProgram}) => ({
                    valid: !!surveyAndProgram.anc,
                    fromADR: !!surveyAndProgram.anc?.fromADR,
                    error: surveyAndProgram.ancError,
                    existingFileName: (surveyAndProgram.anc && surveyAndProgram.anc.filename)|| surveyAndProgram.ancErroredFile,
                    tabClass: {
                        "disabled": !!surveyAndProgram.ancError || !surveyAndProgram.anc,
                        "active": surveyAndProgram.selectedDataType == DataType.ANC
                    }
                } as PartialFileUploadProps),
                programme: ({surveyAndProgram}) => ({
                    valid: surveyAndProgram.program != null,
                    fromADR: !!surveyAndProgram.program?.fromADR,
                    error: surveyAndProgram.programError,
                    existingFileName: (surveyAndProgram.program && surveyAndProgram.program.filename) || surveyAndProgram.programErroredFile,
                    tabClass: {
                        "disabled": !!surveyAndProgram.programError || !surveyAndProgram.program,
                        "active": surveyAndProgram.selectedDataType == DataType.Program
                    }
                } as PartialFileUploadProps),
                survey: ({surveyAndProgram}) => ({
                    valid: surveyAndProgram.survey != null,
                    fromADR: !!surveyAndProgram.survey?.fromADR,
                    error: surveyAndProgram.surveyError,
                    existingFileName: (surveyAndProgram.survey && surveyAndProgram.survey.filename) || surveyAndProgram.surveyErroredFile,
                    tabClass: {
                        "disabled": !!surveyAndProgram.surveyError || !surveyAndProgram.survey,
                        "active": surveyAndProgram.selectedDataType == DataType.Survey
                    }
                } as PartialFileUploadProps),
                features: ({baseline}) => baseline.shape ? baseline.shape.data.features : [] as Feature[],
                featureLevels: ({baseline}) => baseline.shape ? baseline.shape.filters.level_labels : [],
                plottingSelections: ({plottingSelections}) => plottingSelections.sapChoropleth
            }),
            ...mapGettersByNames(namespace, ["data", "filters", "countryAreaFilterOption"]),
            ...mapGetters("metadata", ["sapIndicatorsMetadata"]),
            ...mapGetters("plottingSelections", ["selectedSAPColourScales"]),
            filterTableIndicators() {
                return this.sapIndicatorsMetadata.filter((val: ChoroplethIndicatorMetadata) => val.indicator === this.plottingSelections.indicatorId)
            }
        },
        methods: {
            ...mapActions({
                uploadSurvey: 'surveyAndProgram/uploadSurvey',
                uploadProgram: 'surveyAndProgram/uploadProgram',
                uploadANC: 'surveyAndProgram/uploadANC',
                selectTab: 'surveyAndProgram/selectDataType',
                deleteSurvey: 'surveyAndProgram/deleteSurvey',
                deleteProgram: 'surveyAndProgram/deleteProgram',
                deleteANC: 'surveyAndProgram/deleteANC',
            }),
            ...mapMutations({
                updateChoroplethSelections: "plottingSelections/updateSAPChoroplethSelections",
                updateSAPColourScales: "plottingSelections/updateSAPColourScales",
            }),
        },
        components: {
            Choropleth,
            Filters,
            TableView,
            ManageFile
        }
    })
</script>
