<template>
    <div>
        <button class="btn btn-red btn-lg"
                v-on:click="run"
                :disabled="running">Run model
        </button>
        <h4 v-if="success" class="mt-3" id="model-run-complete">Model run complete
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <modal :open="running">
            <h4>Running model</h4>
            <progress-bar v-for="(phase, index) in phases"
                          :key="index"
                          :phase="phase"
                          :index="index"></progress-bar>
        </modal>
        <div class="mt-3">
            <error-alert v-for="error in errors" :message="error"></error-alert>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import Modal from "../Modal.vue";
    import Tick from "../Tick.vue";
    import {mapActionsByNames, mapGettersByNames, mapStateProps} from "../../utils";
    import {BProgress} from "bootstrap-vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {ProgressPhase} from "../../generated";
    import ProgressBar from "../progress/ProgressBar.vue";

    interface ComputedState {
        runId: string
        success: boolean
        pollId: number
        phases: ProgressPhase[]
    }

    interface ComputedGetters {
        running: boolean
        errorMessage: string
    }

    interface Computed extends ComputedGetters, ComputedState {
    }

    interface Methods {
        run: () => void;
        poll: (runId: string) => void;
        runModelWithParams: () => void;
    }

    const namespace: string = 'modelRun';

    export default Vue.extend<{}, Methods, Computed, {}>({
        name: "ModelRun",
        computed: {
            ...mapStateProps<ModelRunState, keyof ComputedState>(namespace, {
                runId: state => state.modelRunId,
                success: state => state.status.success && (!state.errors.length),
                pollId: state => state.statusPollId,
                errors: state => state.errors,
                phases: state => state.status.progress || []
            }),
            ...mapGettersByNames<keyof ComputedGetters>(namespace, ["running"])
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["run", "poll"])
        },
        watch: {
            runId: function (newVal) {
                if (newVal) {
                    this.poll(newVal)
                }
            }
        },
        created() {
            if (this.runId && this.pollId == -1) {
                this.poll(this.runId);
            }
        },
        components: {
            Modal,
            Tick,
            BProgress,
            ErrorAlert,
            ProgressBar
        }
    });
</script>