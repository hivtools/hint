<template>
    <div class="row">
        <div :class="hasSelectedDataType ? 'col-md-3' : 'col-sm-6 col-md-8'" class="upload-section">
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
            <div v-if="hasSelectedDataType">
                <hr class="my-5"/>
                <choropleth-filters></choropleth-filters>
            </div>
        </div>

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
                <choropleth></choropleth>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import FileUpload from "../FileUpload.vue";
    import Choropleth from "../plots/Choropleth.vue";
    import ChoroplethFilters from "../plots/ChoroplethFilters.vue";
    import {PartialFileUploadProps} from "../../types";
    import {RootState} from "../../root";
    import {DataType} from "../../store/filteredData/filteredData";

    const namespace: string = 'surveyAndProgram';


    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: mapState<RootState>({
            hasSelectedDataType: ({filteredData}) => {
                return filteredData.selectedDataType != null;
            },
            selectedDataType: ({filteredData}) => {
                return filteredData.selectedDataType;
            },
            anc: ({surveyAndProgram, filteredData}) => ({
                valid: !!surveyAndProgram.anc,
                error: surveyAndProgram.ancError,
                existingFileName: surveyAndProgram.anc && surveyAndProgram.anc.filename,
                tabClass: {"disabled": !surveyAndProgram.anc, "active": filteredData.selectedDataType == DataType.ANC}
            } as PartialFileUploadProps),
            programme: ({surveyAndProgram, filteredData}) => ({
                valid: surveyAndProgram.program != null,
                error: surveyAndProgram.programError,
                existingFileName: surveyAndProgram.program && surveyAndProgram.program.filename,
                tabClass: {
                    "disabled": !surveyAndProgram.program,
                    "active": filteredData.selectedDataType == DataType.Program
                }
            } as PartialFileUploadProps),
            survey: ({surveyAndProgram, filteredData}) => ({
                valid: surveyAndProgram.survey != null,
                error: surveyAndProgram.surveyError,
                existingFileName: surveyAndProgram.survey && surveyAndProgram.survey.filename,
                tabClass: {
                    "disabled": !surveyAndProgram.survey,
                    "active": filteredData.selectedDataType == DataType.Survey
                }
            } as PartialFileUploadProps),
        }),
        methods: {
            ...mapActions({
                uploadSurvey: 'surveyAndProgram/uploadSurvey',
                uploadProgram: 'surveyAndProgram/uploadProgram',
                uploadANC: 'surveyAndProgram/uploadANC',
                selectTab: 'filteredData/selectDataType',
                deleteSurvey: 'surveyAndProgram/deleteSurvey',
                deleteProgram: 'surveyAndProgram/deleteProgram',
                deleteANC: 'surveyAndProgram/deleteANC',
            })
        },
        created() {
            if (this.selectedDataType == DataType.Output) {
                this.selectTab(2);
            }
        },
        components: {
            FileUpload,
            Choropleth,
            ChoroplethFilters
        }
    })
</script>