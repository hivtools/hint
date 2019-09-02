<template>
    <div>
        <div class="row">
            <div class="col">
                <h1 class="h2 mb-4">Upload survey and program data</h1>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-3">
                <form>
                    <file-upload label="Survey"
                                 :valid="hasSurvey"
                                 :error="surveyError"
                                 :upload="uploadSurvey"
                                 :existingFileName="surveyFileName"
                                 accept="csv,.csv"
                                 name="survey">
                    </file-upload>
                </form>
            </div>
            <div class="col">
                <choropleth></choropleth>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {SurveyAndProgramDataState} from "../../store/surveyAndProgram/surveyAndProgram";
    import FileUpload from "../FileUpload.vue";
    import Choropleth from "../maps/Choropleth.vue";

    const namespace: string = 'surveyAndProgram';

    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: mapState<SurveyAndProgramDataState>(namespace, {
            hasSurvey: state => state.surveyGeoJson != null,
            surveyError: state => state.surveyError,
            surveyFileName: state => state.surveyFileName
        }),
        methods: {
            ...mapActions({uploadSurvey: 'surveyAndProgram/uploadSurvey'})
        },
        components: {
            FileUpload,
            Choropleth
        }
    })
</script>