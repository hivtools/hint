<template>
    <div class="content">
        <stepper-navigation :back="back"
                            :next="next"
                            :back-disabled="isUploadStep"
                            :next-disabled="isReviewStep">
        </stepper-navigation>
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

    interface Computed {
        isUploadStep: boolean
        isReviewStep: boolean
    }

    interface Data {
        step: number
    }

    interface Methods {
        next: () => void
        back: () => void
    }

    export default Vue.extend<Data, Methods, Computed, unknown>({
        data() {
            return {
                step: 1
            }
        },
        computed: {
            isUploadStep() {
                return this.step === 1
            },
            isReviewStep() {
                return this.step === 2
            }
        },
        methods: {
            next() {
                this.step = 2;
            },
            back() {
                this.step = 1;
            }
        },
        components: {
            AdrIntegration,
            UploadInputs,
            ReviewInputs,
            StepperNavigation
        }
    })
</script>