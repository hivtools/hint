<template>
    <div class="container mb-5">
        <div class="row">
            <template v-for="step in steps">
                <step :key="step.number"
                      :active="active(step.number)"
                      :number="step.number"
                      :text="step.text"
                      :enabled="enabled(step.number)"
                      :complete="complete[step.number]"
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
                <baseline v-if="active(1)"></baseline>
                <survey-and-program v-if="active(2)"></survey-and-program>
                <p v-if="active(3)">Functionality coming soon.</p>
                <model-run v-if="active(4)"></model-run>
            </div>
            <div class="row mt-2">
                <div class="col">
                    <a href="#" id="continue"
                       v-on:click="next"
                       class="text-uppercase font-weight-bold float-right"
                       :class="{'disabled': !complete[activeStep]}">continue</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapState} from "vuex";
    import Step from "./Step.vue";
    import Baseline from "./baseline/Baseline.vue";
    import SurveyAndProgram from "./surveyAndProgram/SurveyAndProgram.vue";
    import {RootState} from "../root";
    import {localStorageManager} from "../localStorageManager";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import ModelRun from "./modelRun/ModelRun.vue";

    type CompleteStatus = {
        [key: number]: boolean
    }

    interface Data {
        activeStep: number
        steps: Step[]
    }

    interface Step {
        number: number,
        text: string
    }

    export default Vue.extend<Data, any, any, any>({
        data(): Data {
            return {
                activeStep: 1,
                steps: [
                    {
                        number: 1,
                        text: "Upload baseline data"
                    },
                    {
                        number: 2,
                        text: "Upload survey and programme data"
                    },
                    {
                        number: 3,
                        text: "Review uploads"
                    },
                    {
                        number: 4,
                        text: "Run model"
                    },
                    {
                        number: 5,
                        text: "Review output"
                    }]
            }
        },
        computed: {
            baselineComplete: function () {
                return this.$store.getters['baseline/complete']
            },
            surveyAndProgramComplete: function () {
                return this.$store.getters['surveyAndProgram/complete']
            },
            complete: function (): CompleteStatus {
                return {
                    1: this.baselineComplete,
                    2: this.surveyAndProgramComplete,
                    3: this.surveyAndProgramComplete, // for now just mark as complete as soon as it's ready
                    4: this.$store.state.modelRun.success,
                    5: false
                }
            },
            ...mapState<RootState>({
                ready: state => state.surveyAndProgram.ready && state.baseline.ready
            })
        },
        methods: {
            jump(num: number) {
                this.activeStep = num;
                localStorageManager.setItem("activeStep", num);
            },
            active(num: number) {
                return this.activeStep == num;
            },
            enabled(num: number) {
                return this.steps.slice(0, num)
                    .filter((s: { number: number }) => this.complete[s.number])
                    .length >= num - 1
            },
            next() {
                if (this.complete[this.activeStep]) {
                    this.jump(this.activeStep + 1);
                }
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
                    const activeStep = localStorageManager.getInt("activeStep");

                    if (activeStep) {
                        const invalidSteps = this.steps.map((s: Step) => s.number)
                            .filter((i: number) => i < activeStep && !this.complete[i]);

                        if (invalidSteps.length == 0) {
                            this.jump(activeStep)
                        } else {
                            localStorageManager.removeItem("activeStep");
                        }
                    }
                }
            }
        }
    })

</script>
