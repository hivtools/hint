<template>
    <div>
        <button class="btn btn-red btn-lg"
                v-on:click="run"
                :disabled="running">Run model
        </button>
        <h4 v-if="complete" class="mt-3" id="model-run-complete">Model run complete
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <modal :open="running">
            <progress-bar v-for="phase in phases"
                          :key="phase.name"
                          :phase="phase"></progress-bar>
            <div class="text-center" v-if="phases.length == 0">
                <h4>Initialising model run</h4>
                <loading-spinner size="sm"></loading-spinner>
            </div>
        </modal>
        <div class="mt-3">
            <error-alert v-for="(error, index) in errors" :key="index" :error="error"></error-alert>
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
    import LoadingSpinner from "../LoadingSpinner.vue";

    interface ComputedState {
        runId: string
        pollId: number
        phases: ProgressPhase[]
    }

    interface ComputedGetters {
        running: boolean
        complete: boolean
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
                pollId: state => state.statusPollId,
                errors: state => state.errors,
                phases: state => {
                    const progress = state.status.progress || [];
                    return progress.map((item, index) => ({...item, name: `${index+1}. ${item.name}`}))
                }
            }),
            ...mapGettersByNames<keyof ComputedGetters>(namespace, ["running", "complete"])
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
            if (this.runId && this.pollId == -1 && !this.complete) {
                this.poll(this.runId);
            }
        },
        components: {
            Modal,
            Tick,
            BProgress,
            ErrorAlert,
            ProgressBar,
            LoadingSpinner
        }
    });
</script>