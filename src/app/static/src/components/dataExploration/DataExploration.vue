<template>
    <div class="content">
        <stepper-navigation :back="back"
                            :next="next"
                            :back-disabled="loading || isUploadStep"
                            :next-disabled="loading || !canProgress">
        </stepper-navigation>
        <hr/>
        <div v-if="loading" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message" v-translate="'loadingData'"></h2>
        </div>
        <div id="data-exploration" class="pt-4" v-if="!loading">
            <adr-integration v-if="isUploadStep"></adr-integration>
            <upload-inputs v-if="isUploadStep"></upload-inputs>
            <review-inputs v-if="isReviewStep"></review-inputs>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import AdrIntegration from "../adr/ADRIntegration.vue";
    import UploadInputs from "../uploadInputs/UploadInputs.vue";
    import ReviewInputs from "../reviewInputs/ReviewInputs.vue";
    import StepperNavigation from "../StepperNavigation.vue";
    import {
        mapStateProp,
        mapGetterByName,
        mapActionByName, mapStatePropByName
    } from "../../utils";
    import {StepperState} from "../../store/stepper/stepper";
    import {BaselineState} from "../../store/baseline/baseline";
    import {SurveyAndProgramState} from "../../store/surveyAndProgram/surveyAndProgram";

    interface Computed {
        step: number,
        baselineReady: boolean,
        baselineValid: boolean,
        surveyAndProgramReady: boolean,
        surveyAndProgramValid: boolean,
        canProgress: boolean,
        isUploadStep: boolean,
        isReviewStep: boolean,
        updatingLanguage: boolean,
        loading: boolean
    }

    interface Methods {
        jump: (step: number) => void,
        next: () => void
        back: () => void
        getPlottingMetadata: (country: string) => void
    }

    export default Vue.extend<unknown, Methods, Computed, unknown>({
        computed: {
            step: mapStateProp<StepperState, number>("stepper", state => state.activeStep),
            canProgress() {
                return this.isUploadStep && this.baselineValid && this.surveyAndProgramValid
            },
            isUploadStep() {
                return this.step === 1
            },
            isReviewStep() {
                return this.step === 2
            },
            baselineValid: mapGetterByName("baseline", "validForDataExploration"),
            surveyAndProgramValid: mapGetterByName("surveyAndProgram", "validForDataExploration"),
            baselineReady: mapStateProp<BaselineState, boolean>("baseline", state => state.ready),
            surveyAndProgramReady: mapStateProp<SurveyAndProgramState, boolean>("surveyAndProgram", state => state.ready),
            updatingLanguage: mapStatePropByName(null, "updatingLanguage"),
            loading() {
                return !this.baselineReady || !this.surveyAndProgramReady || this.updatingLanguage
            }

        },
        methods: {
            next() {
                this.jump(2);
            },
            back() {
                this.jump(1);
            },
            jump: mapActionByName("stepper", "jump"),
            getPlottingMetadata: mapActionByName("metadata", "getPlottingMetadata")
        },
        components: {
            AdrIntegration,
            UploadInputs,
            ReviewInputs,
            StepperNavigation,
            LoadingSpinner
        },
        mounted() {
            // hintr will return default metadata in the absence of a recognised country
            this.getPlottingMetadata("default")
        }
    })
</script>
