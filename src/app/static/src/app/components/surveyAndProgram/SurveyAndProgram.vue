<template>
    <div>
        <div class="row">
            <div class="col-md-3"></div>
            <div v-if="hasSelectedDataType" class="col-md-9 sap-filters">
                <div>

                    <ul class="nav nav-tabs">
                        <li class="nav-item">
                            <a class="nav-link" :class="survey.tabClass" v-on:click="selectTab(2)" v-translate="'survey'"></a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" :class="programme.tabClass" v-on:click="selectTab(1)" v-translate="'ART'">ART</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" :class="anc.tabClass" v-on:click="selectTab(0)" v-translate="'ANC'">ANC</a>
                        </li>
                    </ul>

                </div>
            </div>
        </div>
        <div class="row">
            <choropleth :chartdata="data"
                        :filters="filters"
                        :features="features"
                        :feature-levels="featureLevels"
                        :indicators="choroplethIndicatorsMetadata"
                        :selections="plottingSelections"
                        :hide-controls="!hasSelectedDataType"
                        area-filter-id="area"
                        v-on:update="updateChoroplethSelections({payload: $event})"
                        class="col-md-12">

                <div class="upload-section">
                    <form>
                        <file-upload label="survey"
                                     :valid="survey.valid"
                                     :error="survey.error"
                                     :upload="uploadSurvey"
                                     :delete-file="deleteSurvey"
                                     :existingFileName="survey.existingFileName"
                                     accept="csv,.csv"
                                     name="survey">
                        </file-upload>
                        <file-upload label="ART"
                                     :valid="programme.valid"
                                     :error="programme.error"
                                     :upload="uploadProgram"
                                     :delete-file="deleteProgram"
                                     :existingFileName="programme.existingFileName"
                                     accept="csv,.csv"
                                     name="program">
                        </file-upload>
                        <file-upload label="ANC"
                                     :valid="anc.valid"
                                     :error="anc.error"
                                     :upload="uploadANC"
                                     :delete-file="deleteANC"
                                     :existingFileName="anc.existingFileName"
                                     accept="csv,.csv"
                                     name="anc">
                        </file-upload>
                    </form>
                </div>
            </choropleth>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
    import FileUpload from "../FileUpload.vue";
    import Choropleth from "../plots/choropleth/Choropleth.vue";
    import {PartialFileUploadProps} from "../../types";
    import {RootState} from "../../root";
    import {DataType} from "../../store/surveyAndProgram/surveyAndProgram";
    import {Feature} from "geojson";
    import {ChoroplethSelections} from "../../store/plottingSelections/plottingSelections";

    const namespace: string = 'surveyAndProgram';

    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: {
            ...mapState<RootState>({
                hasSelectedDataType: ({surveyAndProgram}) => {
                    return surveyAndProgram.selectedDataType != null;
                },
                selectedDataType: ({surveyAndProgram}) => {
                    return surveyAndProgram.selectedDataType;
                },
                anc: ({surveyAndProgram}) => ({
                    valid: !!surveyAndProgram.anc,
                    error: surveyAndProgram.ancError,
                    existingFileName: surveyAndProgram.anc && surveyAndProgram.anc.filename,
                    tabClass: {"disabled": !surveyAndProgram.anc, "active": surveyAndProgram.selectedDataType == DataType.ANC}
                } as PartialFileUploadProps),
                programme: ({surveyAndProgram}) => ({
                    valid: surveyAndProgram.program != null,
                    error: surveyAndProgram.programError,
                    existingFileName: surveyAndProgram.program && surveyAndProgram.program.filename,
                    tabClass: {
                        "disabled": !surveyAndProgram.program,
                        "active": surveyAndProgram.selectedDataType == DataType.Program
                    }
                } as PartialFileUploadProps),
                survey: ({surveyAndProgram}) => ({
                    valid: surveyAndProgram.survey != null,
                    error: surveyAndProgram.surveyError,
                    existingFileName: surveyAndProgram.survey && surveyAndProgram.survey.filename,
                    tabClass: {
                        "disabled": !surveyAndProgram.survey,
                        "active": surveyAndProgram.selectedDataType == DataType.Survey
                    }
                } as PartialFileUploadProps),
                features: ({baseline}) => baseline.shape!!.data.features as Feature[],
                featureLevels: ({baseline}) => baseline.shape!!.filters.level_labels || [],
                plottingSelections: ({plottingSelections}) => plottingSelections.sapChoropleth
            }),
            ...mapGetters(namespace, ["data", "filters"]),
            ...mapGetters("metadata", ["choroplethIndicatorsMetadata"])
        },
        methods: {
            ...mapActions({
                uploadSurvey: 'surveyAndProgram/uploadSurvey',
                uploadProgram: 'surveyAndProgram/uploadProgram',
                uploadANC: 'surveyAndProgram/uploadANC',
                selectTab: 'filteredData/selectDataType',
                deleteSurvey: 'surveyAndProgram/deleteSurvey',
                deleteProgram: 'surveyAndProgram/deleteProgram',
                deleteANC: 'surveyAndProgram/deleteANC',
            }),
            ...mapMutations({
                updateChoroplethSelections: "plottingSelections/updateSAPChoroplethSelections"
            })
        },
        created() {
        },
        components: {
            FileUpload,
            Choropleth
        }
    })
</script>