<template>
    <div class="content">
        <stepper-navigation :back="back"
                            :next="next"
                            :back-disabled="isUploadStep"
                            :next-disabled="!canProgress">
        </stepper-navigation>
        <hr/>
        <div class="pt-4">
            <adr-integration v-if="isUploadStep"></adr-integration>
            <upload-inputs v-if="isUploadStep"></upload-inputs>
            <review-inputs v-if="isReviewStep"></review-inputs>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import AdrIntegration from "../adr/ADRIntegration.vue";
    import UploadInputs from "../uploadInputs/UploadInputs.vue";
    import ReviewInputs from "../reviewInputs/ReviewInputs.vue";
    import StepperNavigation from "../StepperNavigation.vue";
    import {mapActionByName, mapGetterByName} from "../../utils";

    interface Computed {
        baselineValid: boolean,
        surveyAndProgramValid: boolean,
        canProgress: boolean,
        isUploadStep: boolean,
        isReviewStep: boolean
    }

    interface Data {
        step: number
    }

    interface Methods {
        next: () => void
        back: () => void
        getPlottingMetadata: (country: string) => void
    }

    export default Vue.extend<Data, Methods, Computed, unknown>({
        data() {
            return {
                step: 1
            }
        },
        computed: {
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
            surveyAndProgramValid: mapGetterByName("surveyAndProgram", "complete")
        },
        methods: {
            next() {
                this.step = 2;
            },
            back() {
                this.step = 1;
            },
            getPlottingMetadata: mapActionByName("metadata", "getPlottingMetadata")
        },
        components: {
            AdrIntegration,
            UploadInputs,
            ReviewInputs,
            StepperNavigation
        },
        mounted() {
            // hintr will return default metadata in the absence of a recognised country
            this.getPlottingMetadata("default")
        }
    })
</script>