<template>
    <div class="container">
        <div class="row">
            <step type="baseline" :active="active('baseline')" @step="step"></step>
            <step type="surveyAndProgram" :active="active('surveyAndProgram')" @step="step"></step>
            <step type="review" :active="active('review')" @step="step"></step>
            <step type="run" :active="active('run')" @step="step"></step>
            <step type="results" :active="active('results')" @step="step"></step>
        </div>
        <div class="pt-5">
            <baseline v-if="active('baseline')"></baseline>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {Dictionary, mapState} from "vuex";
    import {RootState} from "../types";
    import Step from "./Step.vue";
    import Baseline from "./Baseline.vue";

    type StepType = "baseline" | "surveyAndProgram" | "review" | "run" | "results"

    type Status = {
        [key in StepType]: boolean
    }

    interface Computed {
        status: Status
    }

    export default Vue.extend<any, any, Dictionary<Computed>, any>({
        data() {
            return {
                activeRef: ""
            }
        },
        computed: mapState<RootState>({
            status(state): Status {
                return {
                    baseline: state.baseline.complete,
                    surveyAndProgram: false,
                    review: false,
                    run: false,
                    results: false
                }
            }
        }),
        methods: {
            step(type: StepType) {
                this.activeRef = type
            },
            active(type: StepType) {
                return this.activeRef == type
            }
        },
        components: {
            Step,
            Baseline
        }
    })

</script>
