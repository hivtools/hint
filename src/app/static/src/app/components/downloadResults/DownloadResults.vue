<template>
   <div class="row">
       <div class="col-sm-12">
           <h4><translated text-key="exportOutputs"></translated></h4>
           <a class="btn btn-red btn-lg my-3" :href=spectrumUrl>
               <translated text-key="export"></translated>
               <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
           </a>
           <h4 class="mt-4"><translated text-key="downloadSummary"></translated></h4>
           <a class="btn btn-red btn-lg my-3" :href=summaryUrl>
               <translated text-key="download"></translated>
               <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
           </a>
       </div>
   </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapStateProps} from "../../utils";
    import {ModelRunState} from "../../store/modelRun/modelRun";
    import {DownloadIcon} from "vue-feather-icons";

    interface Computed {
        modelRunId: string,
        spectrumUrl: string,
        summaryUrl: string
    }

    export default Vue.extend<{}, {}, Computed>({
        name: "downloadResults",
        computed: {
            ...mapStateProps<ModelRunState, keyof Computed>("modelRun", {
                modelRunId: state => state.modelRunId
            }),
            spectrumUrl: function() {
                    return `/download/spectrum/${this.modelRunId}`
            },
            summaryUrl: function() {
                return `/download/summary/${this.modelRunId}`
            }
        },
        components: {
            DownloadIcon
        }
    });
</script>

