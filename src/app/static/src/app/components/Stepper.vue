<template>
    <div class="container mb-5">
        <div class="row">
            <template v-for="step in steps">
                <step :key="step.number"
                      :active="isActive(step.number)"
                      :number="step.number"
                      :text="step.text"
                      :enabled="isEnabled(step.number)"
                      :complete="isComplete(step.number)"
                      @jump="jump">
                </step>
                <div class="col step-connector" v-if="step.number < steps.length">
                    <hr/>
                </div>
            </template>
        </div>
        <hr/>
        <div v-if="!ready" class="text-center">
            <loading-spinner size="lg"></loading-spinner>
            <h2 id="loading-message">Loading your data</h2>
        </div>
        <div v-if="ready" class="content">
            <div class="pt-4">
                <baseline v-if="isActive(1)"></baseline>
                <survey-and-program v-if="isActive(2)"></survey-and-program>
                <p v-if="isActive(3)">Functionality coming soon.</p>
                <model-run v-if="isActive(4)"></model-run>
            </div>
            <div class="row mt-2">
                <div class="col">
                    <a href="#" id="continue"
                       v-on:click="next"
                       class="text-uppercase font-weight-bold float-right"
                       :class="{'disabled': !isComplete(activeStep)}">continue</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions, mapGetters, mapState} from "vuex";
    import Step from "./Step.vue";
    import Baseline from "./baseline/Baseline.vue";
    import SurveyAndProgram from "./surveyAndProgram/SurveyAndProgram.vue";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import ModelRun from "./modelRun/ModelRun.vue";
    import {StepDescription, StepperState} from "../store/stepper/stepper";

    type CompleteStatus = {
        [key: number]: boolean
    }

    interface Computed {
        activeStep: number,
        steps: StepDescription[],
        ready: boolean,
        complete: boolean
    }

    const namespace: string = 'stepper';

    export default Vue.extend<{}, any, any, any>({
        computed: {
            ...mapState<StepperState>(namespace, {
                activeStep: state => state.activeStep,
                steps: state => state.steps
            }),
            ...mapGetters(namespace, ["ready", "complete"])
        },
        methods: {
            ...mapActions(namespace, ["jump", "next"]),
            ...mapActions(["validate"]),
            isActive(num: number) {
                return this.ready && this.activeStep == num;
            },
            isEnabled(num: number) {
                return this.ready && this.steps.slice(0, num)
                    .filter((s: { number: number }) => this.complete[s.number])
                    .length >= num - 1
            },
            isComplete(num: number) {
                return this.ready && this.complete[num];
            }
        },
        components: {
            Step,
            Baseline,
            SurveyAndProgram,
            LoadingSpinner,
            ModelRun
        },
        watch: {
            ready: function (newVal) {
                if (newVal) {
                    this.validate()
                }
            }
        }
    })

</script>
