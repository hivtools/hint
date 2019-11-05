<template>
   <div class="row">
       <div class="col-sm-12">
           <h4>Download model outputs for Spectrum</h4>
           <a class="btn btn-red btn-lg" :href=spectrumUrl>Download</a>
       </div>
   </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapStateProps} from "../../utils";
    import {ModelRunState} from "../../store/modelRun/modelRun";

    interface Computed {
        modelRunId: string,
        spectrumUrl: string
    }

    export default Vue.extend<{}, {}, Computed>({
        name: "downloadResults",
        computed: {
            ...mapStateProps<ModelRunState, keyof Computed>("modelRun", {
                modelRunId: state => state.modelRunId
            }),
            spectrumUrl: function() {
                    return `/download/spectrum/${this.modelRunId}`
            }
        }
    });
</script>

