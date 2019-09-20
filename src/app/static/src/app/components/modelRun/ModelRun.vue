<template>
    <button class="btn btn-red btn-lg"
            v-on:click="runModelWithParams"
            :disabled="disabled">Run model
    </button>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {ModelSubmitParameters} from "../../generated";
    import {ModelRunState, ModelRunStatus} from "../../store/modelRun/modelRun";

    const namespace: string = 'modelRun';

    export default Vue.extend<any, any, any, any>({
        name: "ModelRun",
        computed: mapState<ModelRunState>(namespace, {
            disabled: state => state.status == ModelRunStatus.Started
        }),
        methods: {
            ...mapActions({
                run: 'modelRun/run'
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
        }
    });
</script>