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
                    <div class="form-group">
                        <label class="font-weight-bold">Survey</label>
                        <tick color="#e31837" v-if="hasSurvey" width="20px"></tick>
                        <div class="custom-file">
                            <input type="file"
                                   class="custom-file-input"
                                   ref="pjnz"
                                   id="pjnz"
                                   v-on:change="handleSurveyFileSelect"/>
                            <label for="pjnz" :class="['custom-file-label', {'selected': fileName}]">
                                {{fileName || "Choose CSV file" }}
                            </label>
                        </div>
                        <error-alert v-if="hasError" :message="error"></error-alert>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import Tick from "../Tick.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {SurveyAndProgramDataState} from "../../store/surveyAndProgram/surveyAndProgram";

    const namespace: string = 'baseline';

    interface Data {
        surveyFile: File | null
        surveyFileName: string
    }

    export default Vue.extend({
        name: "SurveyAndProgram",
        computed: mapState<SurveyAndProgramDataState>(namespace, {
            hasSurvey: state => state.surveyGeoJson != null,
            hasSurveyError: state => state.surveyError.length > 0,
            surveyError: state => state.surveyError
        }),
        data(): Data {
            return {
                surveyFile: null,
                surveyFileName: ""
            }
        },
        methods: {
            ...mapActions({uploadSurvey: 'surveyAndProgram/uploadSurvey'}),
            handleSurveyFileSelect(_: Event, files: FileList | null) {
                if (!files) {
                    files = this.getFilesFromInput("survey")
                }
                this.surveyFile = files && files[0];
                this.surveyFileName = this.getFileName(this.surveyFile);
                this.uploadSurvey(this.surveyFile);
            },
            getFilesFromInput(inputRef: string) {
                const fileInput = this.$refs[inputRef] as HTMLInputElement;
                return fileInput.files
            },
            getFileName(file: File | null) {
                return file && file.name.split("\\").pop() || "";
            }
        },
        components: {
            Tick,
            ErrorAlert
        }
    })
</script>