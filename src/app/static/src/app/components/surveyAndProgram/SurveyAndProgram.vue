<template>
    <div>
        <div class="row">
            <div class="col">
                <h1 class="h2 mb-4">Upload survey and program data</h1>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-10 col-md-8">
                <form>
                    <file-upload label="Survey"
                                 :valid="hasSurvey"
                                 :error="surveyError"
                                 :upload="uploadSurvey"
                                 :existingFileName="surveyFileName"
                                 accept="csv,.csv"
                                 name="survey">
                    </file-upload>
                    <file-upload label="Program"
                                 :valid="hasProgram"
                                 :error="programError"
                                 :upload="uploadProgram"
                                 :existingFileName="programFileName"
                                 accept="csv,.csv"
                                 name="program">
                    </file-upload>
                    <file-upload label="ANC"
                                 :valid="hasANC"
                                 :error="ancError"
                                 :upload="uploadANC"
                                 :existingFileName="ancFileName"
                                 accept="csv,.csv"
                                 name="anc">
                    </file-upload>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {SurveyAndProgramDataState} from "../../store/surveyAndProgram/surveyAndProgram";
    import FileUpload from "../FileUpload.vue";

    const namespace: string = 'surveyAndProgram';

    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: mapState<SurveyAndProgramDataState>(namespace, {
            hasSurvey: state => state.survey != null,
            surveyError: state => state.surveyError,
            surveyFileName: state => state.survey && state.survey.filename,

            hasProgram: state => state.program != null,
            programError: state => state.programError,
            programFileName: state => state.program && state.program.filename,

            hasANC: state => state.anc != null,
            ancError: state => state.ancError,
            ancFileName: state => state.anc && state.anc.filename
        }),
        methods: {
            ...mapActions({
                uploadSurvey: 'surveyAndProgram/uploadSurvey',
                uploadProgram: 'surveyAndProgram/uploadProgram',
                uploadANC: 'surveyAndProgram/uploadANC'
            })
        },
        components: {
            FileUpload
        }
    })
</script>