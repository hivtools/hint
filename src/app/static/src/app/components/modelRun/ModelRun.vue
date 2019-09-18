<template>
    <button class="btn-red btn-lg" v-on:click="runModelWithParams">Run model</button>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions} from "vuex";
    import {ModelSubmitParameters} from "../../generated";

    export default Vue.extend<any, any, any, any>({
        name: "ModelRun",
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