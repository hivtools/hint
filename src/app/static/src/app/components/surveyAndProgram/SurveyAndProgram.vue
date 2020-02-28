<template>
    <div>
        <div class="row">
            <div class="col-md-3"></div>
            <div v-if="showChoropleth" class="col-md-9 sap-filters">
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
                        :indicators="sapIndicatorsMetadata"
                        :selections="plottingSelections"
                        :hide-controls="!showChoropleth"
                        area-filter-id="area"
                        v-on:update="updateChoroplethSelections({payload: $event})"
                        class="col-md-12 pr-0">

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
    import {DataType, SurveyAndProgramState} from "../../store/surveyAndProgram/surveyAndProgram";
    import {Feature} from "geojson";
    import {ChoroplethSelections} from "../../store/plottingSelections/plottingSelections";
    import Component from "vue-class-component";
    import {HintVue} from "../HintVue";
    import {SurveyAndProgramMutation} from "../../store/surveyAndProgram/mutations";
    import {BaselineState} from "../../store/baseline/baseline";

    const namespace: string = 'surveyAndProgram';

    @Component({
        components: {
            FileUpload,
            Choropleth
        },
        computed: {
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
        }
    })
   export default class SurveyAndProgram extends HintVue {

        get sap(): SurveyAndProgramState {
            return this.$store.state.surveyAndProgram;
        }

        get baseline(): BaselineState {
            return this.$store.state.baseline;
        }

        get anc(): PartialFileUploadProps {
            return {
                valid: !!this.sap.anc,
                error: this.sap.ancError,
                existingFileName: this.sap.anc && this.sap.anc.filename,
                tabClass: {"disabled": !this.sap.anc, "active": this.sap.selectedDataType == DataType.ANC}
            }
        }

        get programme(): PartialFileUploadProps {
            return {
                valid: !!this.sap.program,
                error: this.sap.programError,
                existingFileName: this.sap.program && this.sap.program.filename,
                tabClass: {"disabled": !this.sap.program, "active": this.sap.selectedDataType == DataType.Program}
            }
        }

        get survey(): PartialFileUploadProps {
            return {
                valid: !!this.sap.survey,
                error: this.sap.surveyError,
                existingFileName: this.sap.survey && this.sap.survey.filename,
                tabClass: {"disabled": !this.sap.survey, "active": this.sap.selectedDataType == DataType.Survey}
            }
        }

        get showChoropleth() {
            return this.sap.selectedDataType != null
        }

        get features() {
            return this.baseline.shape ? this.baseline.shape.data.features : []
        }

        get featureLevels() {
            return this.baseline.shape ? this.baseline.shape.filters.level_labels : []
        }

        get plottingSelections() {
            return this.$store.state.plottingSelections.sapChoropleth;
        }

   }
</script>