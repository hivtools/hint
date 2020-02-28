<template>
    <div class="row">
        <div class="col-sm-12">
            <h4 v-translate="'exportOutputs'"></h4>
            <a class="btn btn-red btn-lg my-3" :href=spectrumUrl>
                <span v-translate="'export'"></span>
                <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
            </a>
            <h4 class="mt-4" v-translate="'downloadSummary'"></h4>
            <a class="btn btn-red btn-lg my-3" :href=summaryUrl>
                <span v-translate="'download'"></span>
                <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
            </a>
        </div>
    </div>
</template>

<script lang="ts">
    import DownloadIcon from "vue-feather-icons";
    import Component from "vue-class-component";
    import {HintVue} from "../HintVue";

    @Component({
        components: {
            DownloadIcon
        }
    })
    export default class DownloadResults extends HintVue {

        get modelRunId() {
            return this.$store.state.modelRun.modelRunId;
        }

        get spectrumUrl() {
            return `/download/spectrum/${this.modelRunId}`
        }

        get summaryUrl() {
            return `/download/summary/${this.modelRunId}`
        }
    }

</script>

