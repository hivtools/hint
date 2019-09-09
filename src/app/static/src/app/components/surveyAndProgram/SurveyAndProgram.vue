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
                                 :valid="survey.valid"
                                 :error="survey.error"
                                 :upload="uploadSurvey"
                                 :existingFileName="survey.existingFileName"
                                 accept="csv,.csv"
                                 name="survey">
                    </file-upload>
                    <file-upload label="Program"
                                 :valid="programme.valid"
                                 :error="programme.error"
                                 :upload="uploadProgram"
                                 :existingFileName="programme.existingFileName"
                                 accept="csv,.csv"
                                 name="program">
                    </file-upload>
                    <file-upload label="ANC"
                                 :valid="anc.valid"
                                 :error="anc.error"
                                 :upload="uploadANC"
                                 :existingFileName="anc.existingFileName"
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
    import {PartialFileUploadProps} from "../../types";

    const namespace: string = 'surveyAndProgram';

    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: mapState<SurveyAndProgramDataState>(namespace, {
            anc: state => ({
                valid: !!state.anc,
                error: state.ancError,
                existingFileName: state.anc && state.anc.filename
            } as PartialFileUploadProps),
            programme: state => ({
                valid: state.program != null,
                error: state.programError,
                existingFileName: state.program && state.program.filename
            } as PartialFileUploadProps),
            survey: state => ({
                valid: state.survey != null,
                error: state.surveyError,
                existingFileName: state.survey && state.survey.filename
            } as PartialFileUploadProps),
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