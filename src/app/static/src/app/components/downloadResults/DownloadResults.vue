<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
                <div id="spectrum-download">
                  <download :translate-key="translation.spectrum"
                            @click="downloadSpectrum"
                            :modal-open="uploadModalOpen"
                            :file="spectrum"/>
                </div>
                <div id="coarse-output-download">
                  <download :translate-key="translation.coarse"
                            @click="downloadCoarseOutput"
                            :modal-open="uploadModalOpen"
                            :file="coarseOutput"/>
                </div>
                <div id="summary-download">
                  <download :translate-key="translation.summary"
                            @click="downloadSummary"
                            :modal-open="uploadModalOpen"
                            :file="summary"/>
                </div>
            </div>
            <div id="upload" v-if="hasUploadPermission" class="col-sm">
                <h4 v-translate="'uploadFileToAdr'"></h4>
                <button @click.prevent="handleUploadModal"
                        class="btn btn-lg my-3"
                        :class="uploading ? 'btn-secondary' : 'btn-red'"
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
    import {mapActionByName, mapMutationByName, mapStateProp, mapStateProps} from "../../utils";
    import {UploadIcon} from "vue-feather-icons";
    import UploadModal from "./UploadModal.vue";
    import {ADRState} from "../../store/adr/adr";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";
    import ErrorAlert from "../ErrorAlert.vue";
    import i18next from "i18next";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import {DOWNLOAD_TYPE, DownloadResultsState} from "../../store/downloadResults/downloadResults";
    import {DownloadResultsDependency} from "../../types";
    import Download from "./Download.vue";
    import {DownloadResultsMutation} from "../../store/downloadResults/mutations";

    interface Computed {
        uploadingStatus: string,
        currentLanguage: Language,
        currentFileUploading: number | null,
        totalFilesUploading: number | null,
        uploading: boolean,
        uploadComplete: boolean,
        uploadError: null | UploadError,
        hasUploadPermission: boolean,
        downloadingSpectrum: boolean,
        spectrum: Partial<DownloadResultsDependency>,
        coarseOutput: Partial<DownloadResultsDependency>,
        summary: Partial<DownloadResultsDependency>,
        translation: Record<string, any>
    }

    interface UploadError {
        detail: string,
        error: string
    }

    interface Methods {
        handleUploadModal: () => void
        getUserCanUpload: () => void
        getUploadFiles: () => void
        downloadCoarseOutput: () => void
        downloadSpectrum: () => void
        downloadSummary: () => void
        getSummaryDownload: () => void
        getSpectrumDownload: () => void
        getCoarseOutputDownload: () => void
        getUploadMetadata: (id: string) => void
        downloadUrl: (downloadId: string) => string
        stopPolling: (pollingId: number) => void
        handleDownloadResult: (downloadResults: DownloadResultsDependency) => void
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
                spectrum: state => ({
                    downloading: state.spectrum.downloading,
                    complete: state.spectrum.complete,
                    downloadId: state.spectrum.downloadId,
                    statusPollId: state.spectrum.statusPollId,
                    error: state.spectrum.error
                }),
                summary: state => ({
                    downloading: state.summary.downloading,
                    complete: state.summary.complete,
                    downloadId: state.summary.downloadId,
                    statusPollId: state.summary.statusPollId,
                    error: state.summary.error
                }),
                coarseOutput: state => ({
                    downloading: state.coarseOutput.downloading,
                    complete: state.coarseOutput.complete,
                    downloadId: state.coarseOutput.downloadId,
                    statusPollId: state.coarseOutput.statusPollId,
                    error: state.coarseOutput.error
                })
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
          translation() {
            return {
              spectrum: {header: 'exportOutputs', button: 'export'},
              coarse: {header: 'downloadCoarseOutput', button: 'download'},
              summary: {header: 'downloadSummaryReport', button: 'download'}
            }
          }
        },
        methods: {
            downloadUrl(downloadId) {
                return `/download/result/${downloadId}`;
            },
            handleUploadModal() {
                this.uploadModalOpen = true;
            },
            downloadSpectrum() {
                if (!this.spectrum.downloading) {
                    this.getSpectrumDownload();
                }
            },
            downloadSummary() {
                if (!this.summary.downloading) {
                    this.getSummaryDownload();
                }
            },
            downloadCoarseOutput() {
                if (!this.coarseOutput.downloading) {
                    this.getCoarseOutputDownload();
                }
            },
            stopPolling(id) {
              clearInterval(id)
            },
            handleDownloadResult(downloadResults) {
              if(!this.uploadModalOpen) {
                if (downloadResults.complete) {
                  window.location.assign(this.downloadUrl(downloadResults.downloadId));
                  this.getUploadMetadata(downloadResults.downloadId);
                  this.stopPolling(downloadResults.statusPollId)
                }
                if (downloadResults.error && downloadResults.statusPollId > -1) {
                  this.stopPolling(downloadResults.statusPollId);
                }
              }
            },
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles"),
            getSpectrumDownload: mapActionByName("downloadResults", "downloadSpectrum"),
            getSummaryDownload: mapActionByName("downloadResults", "downloadSummary"),
            getCoarseOutputDownload: mapActionByName("downloadResults", "downloadCoarseOutput"),
            getUploadMetadata: mapActionByName("metadata", "getAdrUploadMetadata"),
        },
        mounted() {
            this.getUserCanUpload();
            this.getUploadFiles()
        },
        components: {
            UploadIcon,
            LoadingSpinner,
            Tick,
            ErrorAlert,
            UploadModal,
            Download
        },
        watch: {
            summary: {
                handler(summary) {
                  this.handleDownloadResult(summary)
                },
                deep: true
            },
            spectrum: {
                handler(spectrum) {
                  this.handleDownloadResult(spectrum)
                },
                deep: true
            },
            coarseOutput: {
                handler(coarseOutput) {
                  this.handleDownloadResult(coarseOutput)
                },
                deep: true
            }
        }
    });
</script>
