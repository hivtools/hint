<template>
    <button class="btn btn-red btn-lg"
            v-on:click="runModelWithParams"
            :disabled="status === 'Started'">Run model
    </button>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {ModelSubmitParameters} from "../../generated";
    import {ModelRunState} from "../../store/modelRun/modelRun";

    const namespace: string = 'modelRun';

    export default Vue.extend<any, any, any, any>({
        name: "ModelRun",
        computed: mapState<ModelRunState>(namespace, {
            status: state => state.status,
            runId: state => state.modelRunId
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
            if (this.runId){
                this.poll(this.runId);
            }
        }
    });
</script>