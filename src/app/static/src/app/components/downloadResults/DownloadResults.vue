<template>
    <div class="row">
        <div class="col-sm-12">
            <h4 v-translate="'exportOutputs'"></h4>
            <a class="btn btn-red btn-lg my-3" :href=spectrumUrl>
                <span v-translate="'export'"></span>
                <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
            </a>
            <h4 class="mt-4" v-translate="'downloadCoarseOutput'"></h4>
            <a class="btn btn-red btn-lg my-3" :href=coarseOutputUrl>
                <span v-translate="'download'"></span>
                <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
            </a>
            <h4 class="mt-4" v-translate="'downloadSummaryReport'"></h4>
            <a class="btn btn-red btn-lg my-3" :href=summaryReportUrl>
                <span v-translate="'download'"></span>
                <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
            </a>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProps} from "../../utils";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
    import {DownloadIcon} from "vue-feather-icons";

    interface Computed {
        modelCalibrateId: string,
        spectrumUrl: string,
        coarseOutputUrl: string,
        summaryReportUrl: string
    }

    interface Methods {
        getUserCanUpload: () => void;
    }

    export default Vue.extend<unknown, Methods, Computed>({
        name: "downloadResults",
        computed: {
            ...mapStateProps<ModelCalibrateState, keyof Computed>("modelCalibrate", {
                modelCalibrateId: state => state.calibrateId
            }),
            spectrumUrl: function () {
                return `/download/spectrum/${this.modelCalibrateId}`
            },
            coarseOutputUrl: function () {
                return `/download/coarse-output/${this.modelCalibrateId}`
            },
            summaryReportUrl: function () {
                return `/download/summary/${this.modelCalibrateId}`
            }
        },
        methods: {
          getUserCanUpload: mapActionByName("adr", "getUserCanUpload")
        },
        mounted() {
            this.getUserCanUpload();
        },
        components: {
            DownloadIcon
        }
    });
</script>

