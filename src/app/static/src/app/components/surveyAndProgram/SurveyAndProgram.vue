<template>
    <div>
        <div class="row">
            <div :class="showChoropleth ? 'col-md-3' : 'col-sm-6 col-md-8'" class="upload-section">
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
                <!-- CHORO FILTERS WILL GO HERE  v-if="showChoropleth" -->
            </div>
        </div>
        <div v-if="showChoropleth" class="col-md-9 pl-3 sap-filters">
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
                <choropleth :chartdata="data"
                            :filters="filters"
                            :features="features"
                            :feature-levels="featureLevels"
                            :indicators="sapIndicatorsMetadata"
                            :selections="plottingSelections"
                            :hide-controls="!showChoropleth"
                            area-filter-id="area"
                            v-on:update="updateChoroplethSelections({payload: $event})"></choropleth>
            </div>
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

    const namespace: string = 'surveyAndProgram';

    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: {
            ...mapState<RootState>({
                showChoropleth: ({surveyAndProgram, baseline}) => {
                    return surveyAndProgram.selectedDataType != null;
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
                features: ({baseline}) => baseline.shape ? baseline.shape.data.features : [] as Feature[],
                featureLevels: ({baseline}) => baseline.shape ? baseline.shape.filters.level_labels : [],
                plottingSelections: ({plottingSelections}) => plottingSelections.sapChoropleth
            }),
            ...mapGetters(namespace, ["data", "filters"]),
            ...mapGetters("metadata", ["sapIndicatorsMetadata"])
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
                updateChoroplethSelections: 'surveyAndProgram/'
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