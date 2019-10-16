<template>
    <div>
        <button class="btn btn-red btn-lg"
                v-on:click="runModelWithParams"
                :disabled="running">Run model
        </button>
        <h4 v-if="success" class="mt-3" id="model-run-complete">Model run complete
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <modal :open="running">
            <h4>Running model</h4>
            <b-progress :value="progress" :max="1" show-progress animated></b-progress>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {ModelSubmitParameters} from "../../generated";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import Modal from "../Modal.vue";
    import Tick from "../Tick.vue";
    import {mapActionsByNames, mapGettersByNames, mapStateProps} from "../../utils";
    import {BProgress} from "bootstrap-vue";

    interface ComputedState {
        runId: string
        success: boolean
    }

    interface ComputedGetters {
        running: boolean
    }

    interface Computed extends ComputedGetters, ComputedState {}

    interface Methods {
        run: (params: ModelSubmitParameters) => void;
        poll: (runId: string) => void;
        runModelWithParams: () => void;
    }

    const namespace: string = 'modelRun';

    export default Vue.extend<{}, Methods, Computed, {}>({
        name: "ModelRun",
        computed: {
            ...mapStateProps<ModelRunState, keyof ComputedState>(namespace, {
                runId: state => state.modelRunId,
                success: state => state.status.success,
                progress: state => parseFloat(state.status.progress)
            }),
            ...mapGettersByNames<keyof ComputedGetters>(namespace, ["running"])
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["run", "poll"]),
            runModelWithParams: function () {
                const params: ModelSubmitParameters = {
                    max_iterations: 1,
                    no_of_simulations: 2,
                    options: {
                        programme: false,
                        anc: true
                    }
                };

                this.run(params);
            }
        },
        watch: {
            runId: function (newVal) {
                if (newVal) {
                    this.poll(newVal)
                }
            }
        },
        created() {
            if (this.runId) {
                this.poll(this.runId);
            }
        },
        components: {
            Modal,
            Tick,
            BProgress
        }
    });
</script>