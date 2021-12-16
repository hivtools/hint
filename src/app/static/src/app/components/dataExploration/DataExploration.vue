<template>
    <div class="content">
        <stepper-navigation :back="back"
                            :next="next"
                            :back-disabled="isUploadStep"
                            :next-disabled="isReviewStep">
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
    import {mapMutationByName, mapStateProp} from "../../utils";
    import {StepperState} from "../../store/stepper/stepper";
    import {PayloadWithType} from "../../types";

    interface Computed {
        step: number,
        isUploadStep: boolean
        isReviewStep: boolean
    }

    interface Methods {
        jump: (step: PayloadWithType<number>) => void,
        jumpTo: (step: number) => void,
        next: () => void
        back: () => void
    }

    export default Vue.extend<{}, Methods, Computed, unknown>({
        computed: {
            step: mapStateProp<StepperState, number>("stepper", state => state.activeStep),
            isUploadStep() {
                return this.step === 1
            },
            isReviewStep() {
                return this.step === 2
            }
        },
        methods: {
            jump: mapMutationByName("stepper", "Jump"),
            jumpTo(step: number) {
              this.jump({type: "Jump", payload: step});
            },
            next() {
                this.jumpTo(2);
            },
            back() {
                this.jumpTo(1);
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
