<template>
    <div class="container">
        <b-alert v-if="uploadSucceeded" variant="success"
                 dismissible fade :show="showAlert"
                 @dismissed="showAlert=false"> {{uploadStatus}}
        </b-alert>
        <error-alert v-if="uploadError" :error="uploadError"></error-alert>
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
                <a @click.prevent="handleUploadModal" class="btn btn-red btn-lg my-3" href="#">
                    <span v-translate="'upload'"></span>
                    <upload-icon size="20" class="icon ml-2" style="margin-top: -4px;"></upload-icon>
                </a>
            </div>
        </div>
        <upload-modal id="modal" :open="uploadModalOpen" @close="closeUploadModal"></upload-modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ModelCalibrateState} from "../../store/modelCalibrate/modelCalibrate";
    import {DownloadIcon, UploadIcon} from "vue-feather-icons";
    import UploadModal from "./UploadModal.vue";
    import {ADRState} from "../../store/adr/adr";
    import {BAlert} from "bootstrap-vue";
    import ErrorAlert from "../ErrorAlert.vue";

    interface Computed {
        modelCalibrateId: string,
        spectrumUrl: string,
        coarseOutputUrl: string,
        summaryReportUrl: string,
        hasUploadPermission: boolean
        uploadSucceeded: boolean
        uploadStatus: string
        uploadError: Error
    }

    interface Methods {
        handleUploadModal: () => void
        getUserCanUpload: () => void
        getUploadFiles: () => void
        closeUploadModal: () => void
    }

    interface Data {
        uploadModalOpen: boolean,
        showAlert: boolean
    }

    export default Vue.extend<Data, Methods, Computed>({
        name: "downloadResults",
        data() {
            return {
                uploadModalOpen: false,
                showAlert: false
            }
        },
        computed: {
            ...mapStateProps<ModelCalibrateState, keyof Computed>("modelCalibrate", {
                modelCalibrateId: state => state.calibrateId
            }),
            ...mapStateProps<ADRState, keyof Computed>("adr", {
                uploadSucceeded: state => state.uploadSucceeded,
                uploadStatus: state => state.uploadStatus,
                uploadError: state => state.uploadError,
                hasUploadPermission: state => state.userCanUpload
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
            handleUploadModal() {
                this.uploadModalOpen = true
            },
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adr", "getUploadFiles"),
            closeUploadModal() {
                this.uploadModalOpen = false
                this.showAlert = true
            }
        },
        mounted() {
            this.getUserCanUpload();
            this.getUploadFiles()
        },
        components: {
            DownloadIcon,
            UploadIcon,
            UploadModal,
            BAlert,
            ErrorAlert
        }
    });
</script>