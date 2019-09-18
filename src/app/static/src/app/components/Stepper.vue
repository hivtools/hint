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
        <div v-if="!ready">
LOADING
        </div>
        <div v-if="ready">
            <div class="pt-4">
                <baseline v-if="active(1)"></baseline>
                <survey-and-program v-if="active(2)"></survey-and-program>
                <p v-if="active(3)">Functionality coming soon.</p>
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

    type CompleteStatus = {
        [key: number]: boolean
    }

    interface Data {
        activeStep: number
        steps: { number: number, text: string }[]
    }

    export default Vue.extend({
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
                    4: false,
                    5: false
                }
            },
            ...mapState<RootState>({
                ready: state => state.surveyAndProgram.ready && state.baseline.ready
            })
        },
        methods: {
            jump(num: number) {
                this.activeStep = num
            },
            active(num: number) {
                return this.activeStep == num;
            },
            enabled(num: number) {
                return this.steps.slice(0, num)
                    .filter((s) => this.complete[s.number])
                    .length >= num - 1
            },
            next() {
                if (this.complete[this.activeStep]) {
                    this.activeStep = this.activeStep + 1;
                }
            }
        },
        components: {
            Step,
            Baseline,
            SurveyAndProgram
        }
    })

</script>
