<template>
    <div>
        <custom-form id="model-run-options"></custom-form>
        <button class="btn btn-red btn-lg"
                v-on:click="runModelWithParams"
                :disabled="running">Run model
        </button>
        <h4 v-if="success" class="mt-3" id="model-run-complete">Model run complete
            <tick color="#e31837" width="20px"></tick>
        </h4>
        <modal :open="running">
            <h4>Running model</h4>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {ModelSubmitParameters} from "../../generated";
    import {ModelRunState, ModelRunStatus} from "../../store/modelRun/modelRun";
    import Modal from "../Modal.vue";
    import Tick from "../Tick.vue";
    import CustomForm from "../forms/CustomForm.vue";

    const namespace: string = 'modelRun';

    export default Vue.extend<any, any, any, any>({
        name: "ModelRun",
        computed: mapState<ModelRunState>(namespace, {
            runId: state => state.modelRunId,
            running: state => state.status == ModelRunStatus.Started,
            success: state => state.success
        }),
        methods: {
            ...mapActions({
                run: 'modelRun/run',
                poll: 'modelRun/poll'
            }),
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
            CustomForm
        }
    });
</script>