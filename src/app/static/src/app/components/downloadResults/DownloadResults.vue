<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
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
            <div id="upload" v-if="hasUploadPermit" class="col-sm">
                <h4 v-translate="'outputFileToAdr'"></h4>
                <a @click.prevent="handleUploadModal" class="btn btn-red btn-lg my-3" href=#>
                    <span v-translate="'upload'"></span>
                    <upload-icon size="20" class="icon ml-2" style="margin-top: -4px;"></upload-icon>
                </a>
            </div>
        </div>
        <upload-modal :open="modelOpen" @close="modelOpen = false"></upload-modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapStateProps} from "../../utils";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import UploadModal from "./UploadModal.vue";

    interface Computed {
        modelCalibrateId: string,
        spectrumUrl: string,
        coarseOutputUrl: string,
        summaryReportUrl: string,
        hasUploadPermit: boolean
    }

    interface Methods {
        handleUploadModal: () => void
    }

    interface Data {
        modelOpen: boolean
    }

    export default Vue.extend<Data, Methods, Computed>({
        name: "downloadResults",
        data() {
            return {
                modelOpen: false
            }
        },
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
            },
            hasUploadPermit: function () {
                // this will be implemented as soon as we can get user's permission from ADR
                return true
            }

        },
        methods: {
            handleUploadModal() {
                this.modelOpen = true
            }
        },
        components: {
            DownloadIcon,
            UploadIcon,
            UploadModal
        }
    });
</script>

