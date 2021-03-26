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
            <div id="upload" v-if="hasUploadPermission" class="col-sm">
                <h4 v-translate="'uploadFileToAdr'"></h4>
                <!-- <a @click.prevent="handleUploadModal" class="btn btn-red btn-lg my-3" href="#" :disabled="uploading">
                    <span v-translate="'upload'"></span>
                    <upload-icon size="20" class="icon ml-2" style="margin-top: -4px;"></upload-icon>
                </a> -->
                <button @click.prevent="handleUploadModal" class="btn btn-red btn-lg my-3" href="#" :disabled="uploading">
                    <span v-translate="'upload'"></span>
                    <upload-icon size="20" class="icon ml-2" style="margin-top: -4px;"></upload-icon>
                </button>
                <!-- <div>{{ uploadStatusMessage }}</div> -->
                <div v-if="uploadStatusMessage" class="d-flex align-items-end">
                    <loading-spinner v-if="uploading" size="xs"></loading-spinner>
                    <div class="d-flex align-items-center height-40" :class="{'ml-1': uploading, 'mr-1': uploadComplete}">
                        <span :class="{'text-danger': uploadError, 'font-weight-bold': uploadComplete}">{{ uploadStatusMessage }}</span>
                    </div>
                    <div class="d-flex align-items-center height-40">
                        <tick color="#e31837" v-if="uploadComplete" width="20px"></tick>
                    </div>
                </div>
            </div>
        </div>
        <upload-modal id="modal" :open="uploadModalOpen" @close="uploadModalOpen = false"></upload-modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import UploadModal from "./UploadModal.vue";
    import {ADRState} from "../../store/adr/adr";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";

    interface Computed {
        modelCalibrateId: string,
        spectrumUrl: string,
        coarseOutputUrl: string,
        summaryReportUrl: string,
        uploadStatusMessage: string,
        uploading: boolean,
        uploadComplete: boolean,
        uploadError: null | UploadError,
        hasUploadPermission: boolean
    }

    interface UploadError {
        detail: string,
        error: string
    }

    interface Methods {
        handleUploadModal: () => void
        getUserCanUpload: () => void
        getUploadFiles: () => void
    }

    interface Data {
        uploadModalOpen: boolean
    }

    export default Vue.extend<Data, Methods, Computed>({
        name: "downloadResults",
        data() {
            return {
                uploadModalOpen: false
            }
        },
        computed: {
            ...mapStateProps<ModelCalibrateState, keyof Computed>("modelCalibrate", {
                modelCalibrateId: state => state.calibrateId
            }),
            ...mapStateProps<ADRState, keyof Computed>("adr", {
                uploading: state => state.uploading,
                uploadComplete: state => state.uploadComplete,
                uploadError: state => state.uploadError
            }),
            uploadStatusMessage: function(){
                if (this.uploadError){
                    if ("detail" in this.uploadError){
                        return this.uploadError.detail
                    } else return this.uploadError
                } else if (this.uploadComplete){
                    return 'Upload complete'
                } else if (this.uploading){
                    return 'Uploading (this may take a while)'
                } else return ''
            },
            hasUploadPermission: mapStateProp<ADRState, boolean>("adr",
                (state: ADRState) => state.userCanUpload
            ),
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
            handleUploadModal() {
                this.uploadModalOpen = true
            },
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adr", "getUploadFiles")
        },
        mounted() {
            this.getUserCanUpload();
            this.getUploadFiles()
        },
        components: {
            DownloadIcon,
            UploadIcon,
            LoadingSpinner,
            Tick,
            UploadModal
        }
    });
</script>

