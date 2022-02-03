<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
                <div id="spectrum-download">
                    <download :translate-key="translation.spectrum"
                              @click="downloadSpectrum"
                              :disabled="!spectrum.downloadId || spectrum.preparing"
                              :file="spectrum"/>
                </div>
                <div id="coarse-output-download">
                    <download :translate-key="translation.coarse"
                              @click="downloadCoarseOutput"
                              :disabled="!coarseOutput.downloadId || coarseOutput.preparing"
                              :file="coarseOutput"/>
                </div>
                <div id="summary-download">
                    <download :translate-key="translation.summary"
                              @click="downloadSummary"
                              :disabled="!summary.downloadId || summary.preparing"
                              :file="summary"/>
                </div>
            </div>
            <div id="upload" v-if="hasUploadPermission" class="col-sm">
                <h4 v-translate="'uploadFileToAdr'"></h4>
                <button @click.prevent="handleUploadModal"
                        class="btn btn-lg my-3"
                        :class="uploading || isPreparing ? 'btn-secondary' : 'btn-red'"
                        :disabled="uploading || isPreparing">
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
                        <tick color="#e31837" v-if="uploadComplete"></tick>
                    </div>
                </div>
                <div id="releaseCreated" v-if="releaseCreated || releaseFailed" class="d-flex align-items-end">
                    <div class="d-flex align-items-center height-40 mr-1">
                        <span class="font-weight-bold"
                              v-translate="releaseCreated ? 'releaseCreated' : 'releaseFailed'"></span>
                    </div>
                    <div class="d-flex align-items-center height-40">
                        <component :is="releaseCreated ? 'tick' : 'cross'" color="#e31837"></component>
                    </div>
                </div>
                <error-alert v-if="uploadError" :error="uploadError"></error-alert>
            </div>
        </div>
        <upload-modal id="upload-modal" v-if="uploadModalOpen" @close="uploadModalOpen = false"></upload-modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapMutationByName} from "../../utils";
    import {UploadIcon} from "vue-feather-icons";
    import UploadModal from "./UploadModal.vue";
    import {ADRState} from "../../store/adr/adr";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";
    import Cross from "../Cross.vue";
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";
    import ErrorAlert from "../ErrorAlert.vue";
    import i18next from "i18next";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import {DownloadResultsState} from "../../store/downloadResults/downloadResults";
    import {DownloadResultsDependency} from "../../types";
    import Download from "./Download.vue";
    import {Error} from "../../generated"

    interface Computed {
        uploadingStatus: string,
        currentLanguage: Language,
        currentFileUploading: number | null,
        totalFilesUploading: number | null,
        uploading: boolean,
        uploadComplete: boolean,
        releaseCreated: boolean,
        releaseFailed: boolean,
        uploadError: Error | null,
        hasUploadPermission: boolean,
        spectrum: DownloadResultsDependency,
        coarseOutput: DownloadResultsDependency,
        summary: DownloadResultsDependency
        translation: Record<string, any>,
        isPreparing: boolean
    }

    interface Methods {
        handleUploadModal: () => void
        getUserCanUpload: () => void
        getUploadFiles: () => void
        clearStatus: () => void;
        prepareOutputs: () => void
        downloadSummary: () => void
        downloadSpectrum: () => void
        downloadCoarseOutput: () => void
        getUploadMetadata: (id: string) => void
        downloadUrl: (downloadId: string) => string
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
            spectrum: mapStateProp<DownloadResultsState, DownloadResultsDependency>("downloadResults",
                (state) => state.spectrum),
            summary: mapStateProp<DownloadResultsState, DownloadResultsDependency>("downloadResults",
                (state) => state.summary),
            coarseOutput: mapStateProp<DownloadResultsState, DownloadResultsDependency>("downloadResults",
                (state) => state.coarseOutput),
            currentFileUploading: mapStateProp<ADRUploadState, number | null>("adrUpload",
                state => state.currentFileUploading),
            totalFilesUploading: mapStateProp<ADRUploadState, number | null>("adrUpload",
                state => state.totalFilesUploading),
            uploading: mapStateProp<ADRUploadState, boolean>("adrUpload", state => state.uploading),
            uploadComplete: mapStateProp<ADRUploadState, boolean>("adrUpload", state => state.uploadComplete),
            releaseCreated: mapStateProp<ADRUploadState, boolean>("adrUpload", state => state.releaseCreated),
            releaseFailed: mapStateProp<ADRUploadState, boolean>("adrUpload", state => state.releaseFailed),
            uploadError: mapStateProp<ADRUploadState, Error | null>("adrUpload", state => state.uploadError),
            hasUploadPermission: mapStateProp<ADRState, boolean>("adr", (state: ADRState) => state.userCanUpload),
            uploadingStatus() {
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
            },
            isPreparing() {
                return this.summary.preparing || this.spectrum.preparing || this.coarseOutput.preparing
            }
        },
        methods: {
            downloadUrl(downloadId) {
                return `/download/result/${downloadId}`;
            },
            handleUploadModal() {
                this.uploadModalOpen = true;
            },
            handleDownloadResult(downloadResults) {
                window.location.assign(this.downloadUrl(downloadResults.downloadId));
                this.getUploadMetadata(downloadResults.downloadId);
            },
            downloadSpectrum() {
                this.handleDownloadResult(this.spectrum)
            },
            downloadSummary() {
                this.handleDownloadResult(this.summary)
            },
            downloadCoarseOutput() {
                this.handleDownloadResult(this.coarseOutput)
            },
            clearStatus: mapMutationByName("adrUpload", "ClearStatus"),
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles"),
            prepareOutputs: mapActionByName("downloadResults", "prepareOutputs"),
            getUploadMetadata: mapActionByName("metadata", "getAdrUploadMetadata"),
        },
        mounted() {
            this.getUserCanUpload();
            this.getUploadFiles();
            this.prepareOutputs();
        },
        beforeMount() {
            this.clearStatus();
        },
        components: {
            UploadIcon,
            LoadingSpinner,
            Tick,
            Cross,
            ErrorAlert,
            UploadModal,
            Download
        }
    });
</script>
