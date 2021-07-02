<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
                <h4 v-translate="'exportOutputs'"></h4>
                <span class="btn btn-red btn-lg my-3"
                @click="handleDownload('spectrum')">
                    <span v-translate="'export'"></span>
                    <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
                </span>
                <h4 class="mt-4" v-translate="'downloadCoarseOutput'"></h4>
                <span class="btn btn-red btn-lg my-3" @click="handleDownload('coarse-output')">
                    <span v-translate="'download'"></span>
                    <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
                </span>
                <h4 class="mt-4" v-translate="'downloadSummaryReport'"></h4>
                <span class="btn btn-red btn-lg my-3" @click="handleDownload('summary')">
                    <span v-translate="'download'"></span>
                    <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
                </span>
            </div>
            <div id="upload" v-if="hasUploadPermission" class="col-sm">
                <h4 v-translate="'uploadFileToAdr'"></h4>
                <button @click.prevent="handleUploadModal" 
                        class="btn btn-lg my-3" 
                        :class="uploading ? 'btn-secondary' : 'btn-red'"
                        href="#" 
                        :disabled="uploading">
                    <span v-translate="'upload'"></span>
                    <upload-icon size="20" class="icon ml-2" style="margin-top: -4px;"></upload-icon>
                </button>
                <div id="uploading" v-if="uploading" class="d-flex align-items-end">
                    <loading-spinner size="xs"></loading-spinner>
                    <div class="d-flex align-items-center height-40 ml-2'">
                        <span>{{ uploadingStatus }}</span>
                    </div>
                </div>
                <div id="uploadComplete" v-if="uploadComplete" class="d-flex align-items-end">
                    <div class="d-flex align-items-center height-40 mr-1">
                        <span class="font-weight-bold" v-translate="'uploadComplete'"></span>
                    </div>
                    <div class="d-flex align-items-center height-40">
                        <tick color="#e31837" v-if="uploadComplete" width="20px"></tick>
                    </div>
                </div>
                <error-alert v-if="uploadError" :error="uploadError"></error-alert>
            </div>
        </div>
        <upload-modal id="upload-modal" :open="uploadModalOpen" @close="uploadModalOpen = false"></upload-modal>
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
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";
    import ErrorAlert from "../ErrorAlert.vue";
    import i18next from "i18next";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import {DownloadResultsState} from "../../store/downloadResults/downloadResults";
    import {router} from "../../router";

    interface Computed {
        downloadId: string,
        downloading: boolean,
        spectrumUrl: string,
        coarseOutputUrl: string,
        summaryReportUrl: string,
        uploadingStatus: string,
        currentLanguage: Language,
        currentFileUploading: number | null,
        totalFilesUploading: number | null,
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
        download: (downloadType: string) => void
        handleDownload: (downloadType: string) => void
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
            ...mapStateProps<DownloadResultsState, keyof Computed>("downloadResults", {
                downloadId: state => state.downloadId,
                downloading: state => state.downloading
            }),
            ...mapStateProps<ADRUploadState, keyof Computed>("adrUpload", {
                currentFileUploading: state => state.currentFileUploading,
                totalFilesUploading: state => state.totalFilesUploading,
                uploading: state => state.uploading,
                uploadComplete: state => state.uploadComplete,
                uploadError: state => state.uploadError
            }),
            hasUploadPermission: mapStateProp<ADRState, boolean>("adr",
                (state: ADRState) => state.userCanUpload
            ),
            uploadingStatus: function () {
                return i18next.t("uploadingStatus", {
                    fileNumber: this.currentFileUploading,
                    totalFiles: this.totalFilesUploading,
                    lng: this.currentLanguage,
                });
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            spectrumUrl: function () {
                return ""
                //return `/download/spectrum/${this.modelCalibrateId}`
            },
            coarseOutputUrl: function () {
                return ""
                //return `/download/coarse-output/${this.modelCalibrateId}`
            },
            summaryReportUrl: function () {
                return ""
               // return `/download/summary/${this.modelCalibrateId}`
            }
        },
        methods: {
            handleUploadModal() {
                this.uploadModalOpen = true
            },
            handleDownload(downloadType) {
                if (!this.downloading) {
                    this.download(downloadType)
                }
            },
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles"),
            download: mapActionByName("downloadResults", "download")
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
            ErrorAlert,
            UploadModal
        }
    });
</script>

