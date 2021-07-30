<template>
    <div>
        <div class="row">
            <ul class="nav nav-tabs">
                <li class="nav-item">
                    <a class="nav-link active" v-translate="'map'"></a>
                </li>
            </ul>
        </div>
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
                <div v-if="showChoropleth" class="form-group">
                    <label class="font-weight-bold" id="data-source-header" v-translate="'dataSource'"></label>
                    <treeselect
                            :multiple="false"
                            :clearable="false"
                            :options="dataSourceOptions"
                            :value="selectedDataType"
                            @select="selectDataSource">
                    </treeselect>
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
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import i18next from "i18next";
    import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import TableView from "../plots/table/Table.vue";
    import Filters from "../plots/Filters.vue";
    import {Filter, LevelLabel, PartialFileUploadProps, PayloadWithType} from "../../types";
    import {RootState} from "../../root";
    import {DataType, SurveyAndProgramState} from "../../store/surveyAndProgram/surveyAndProgram";
    import {Feature} from "geojson";
    import {ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
    import {mapActionByName, mapGettersByNames, mapStateProp} from "../../utils";
    import {
        ChoroplethSelections,
        PlottingSelectionsState,
        ScaleSelections
    } from "../../store/plottingSelections/plottingSelections";
    import ManageFile from "../files/ManageFile.vue";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Language} from "../../store/translations/locales";

    const namespace = 'surveyAndProgram';

    interface Data {
        areaFilterId: string
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
        dataSourceOptions: FilterOption[]
    }

    interface Methods {
        selectDataType: (payload: DataType) => void,
        selectDataSource: (option: FilterOption) => void
    }

    export default Vue.extend<Data, Methods, Computed, unknown>({
        name: "SurveyAndProgram",
        data: () => {
            return {
                areaFilterId: "area"
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
                    valid: !!surveyAndProgram.anc,
                    fromADR: !!surveyAndProgram.anc?.fromADR,
                    error: surveyAndProgram.ancError,
                    existingFileName: (surveyAndProgram.anc && surveyAndProgram.anc.filename)|| surveyAndProgram.ancErroredFile,
                    available: !surveyAndProgram.ancError && surveyAndProgram.anc
                } as PartialFileUploadProps),
                programme: ({surveyAndProgram}: {surveyAndProgram: SurveyAndProgramState}) => ({
                    valid: surveyAndProgram.program != null,
                    fromADR: !!surveyAndProgram.program?.fromADR,
                    error: surveyAndProgram.programError,
                    existingFileName: (surveyAndProgram.program && surveyAndProgram.program.filename) || surveyAndProgram.programErroredFile,
                    available: !surveyAndProgram.programError && surveyAndProgram.program
                } as PartialFileUploadProps),
                survey: ({surveyAndProgram}: {surveyAndProgram: SurveyAndProgramState}) => ({
                    valid: surveyAndProgram.survey != null,
                    fromADR: !!surveyAndProgram.survey?.fromADR,
                    error: surveyAndProgram.surveyError,
                    existingFileName: (surveyAndProgram.survey && surveyAndProgram.survey.filename) || surveyAndProgram.surveyErroredFile,
                    available: !surveyAndProgram.surveyError && surveyAndProgram.survey
                } as PartialFileUploadProps),
                features: ({baseline} : {baseline: BaselineState}) => baseline.shape ? baseline.shape.data.features : [] as Feature[],
                featureLevels: ({baseline} : {baseline: BaselineState}) => baseline.shape ? baseline.shape.filters.level_labels : [],
                plottingSelections: ({plottingSelections}: {plottingSelections: PlottingSelectionsState}) => plottingSelections.sapChoropleth
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
            ...mapActions({
                uploadSurvey: 'surveyAndProgram/uploadSurvey',
                uploadProgram: 'surveyAndProgram/uploadProgram',
                uploadANC: 'surveyAndProgram/uploadANC',
                deleteSurvey: 'surveyAndProgram/deleteSurvey',
                deleteProgram: 'surveyAndProgram/deleteProgram',
                deleteANC: 'surveyAndProgram/deleteANC',
            }),
            ...mapMutations({
                updateChoroplethSelections: "plottingSelections/updateSAPChoroplethSelections",
                updateSAPColourScales: "plottingSelections/updateSAPColourScales",
            }),
            selectDataType: mapActionByName(namespace, "selectDataType"),
            selectDataSource: function(option: FilterOption) {
                this.selectDataType(parseInt(option.id))
            }
        },
        components: {
            Choropleth,
            Filters,
            TableView,
            ManageFile,
            Treeselect
        }
    })
</script>
