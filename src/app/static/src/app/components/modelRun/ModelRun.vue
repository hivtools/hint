<template>
    <div>
        <dynamic-form id="model-run-options"
                     ref="modelRunForm"
                     @submit="runModelWithParams"
                     :include-submit-button="false"></dynamic-form>
        <button class="btn btn-red btn-lg"
                v-on:click="submitForm"
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
    import {Dictionary, mapActions, mapState} from "vuex";
    import {ModelRunState, ModelRunStatus} from "../../store/modelRun/modelRun";
    import Modal from "../Modal.vue";
    import Tick from "../Tick.vue";
    import DynamicForm from "../forms/DynamicForm.vue";

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
            submitForm: function () {
                this.$refs.modelRunForm.submit();
            },
            runModelWithParams: function (params: Dictionary<any>) {
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
            DynamicForm
        }
    });
</script>