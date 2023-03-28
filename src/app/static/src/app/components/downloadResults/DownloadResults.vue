<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
                <div id="spectrum-download">
                    <download :translate-key="translation.spectrum"
                              @click="downloadSpectrumOutput"
                              :disabled="!spectrum.downloadId || spectrum.preparing"
                              :file="spectrum"/>
                    <div class="pb-2">
                    <error-alert v-if="spectrum.downloadError" :error="spectrum.downloadError"></error-alert>
                    </div>
                </div>
                <div id="coarse-output-download">
                    <download :translate-key="translation.coarse"
                              @click="downloadCoarseOutput"
                              :disabled="!coarseOutput.downloadId || coarseOutput.preparing"
                              :file="coarseOutput"/>
                    <div class="pb-2">
                        <error-alert v-if="coarseOutput.downloadError" :error="coarseOutput.downloadError"></error-alert>
                    </div>
                </div>
                <div id="summary-download">
                    <download :translate-key="translation.summary"
                              @click="downloadSummaryReport"
                              :disabled="!summary.downloadId || summary.preparing"
                              :file="summary"/>
                    <div class="pb-2">
                    <error-alert v-if="summary.downloadError" :error="summary.downloadError"></error-alert>
                    </div>
                </div>
                <div id="comparison-download" v-if="comparisonSwitch">
                    <download :translate-key="translation.comparison"
                              @click="downloadComparisonReport"
                              :disabled="!comparison.downloadId || comparison.preparing"
                              :file="comparison"/>
                    <error-alert v-if="comparison.downloadError" :error="comparison.downloadError"></error-alert>
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
    import {mapActionByName, mapStateProp, mapMutationByName, mapStateProps} from "../../utils";
    import {UploadIcon} from "vue-feather";
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
    import {switches} from "../../featureSwitches";

    interface ComputedFromADRUpload {
        uploading: boolean,
        uploadComplete: boolean,
        releaseCreated: boolean,
        releaseFailed: boolean,
        uploadError: Error | null,
        currentFileUploading: number | null,
        totalFilesUploading: number | null
    }

    interface ComputedFromDownloadResults {
        spectrum: DownloadResultsDependency,
        coarseOutput: DownloadResultsDependency,
        summary: DownloadResultsDependency,
        comparison: DownloadResultsDependency
    }

    interface Computed extends ComputedFromADRUpload, ComputedFromDownloadResults {
        uploadingStatus: string,
        currentLanguage: Language,
        hasUploadPermission: boolean,
        translation: Record<string, any>,
        isPreparing: boolean
    }

    interface Methods {
        handleUploadModal: () => void
        getUserCanUpload: () => void
        getUploadFiles: () => void
        clearStatus: () => void;
        prepareOutputs: () => void
        downloadSummaryReport: () => void
        downloadSpectrumOutput: () => void
        downloadCoarseOutput: () => void
        downloadComparisonReport: () => void
    }

    interface Data {
        uploadModalOpen: boolean,
        comparisonSwitch: boolean
    }

    export default Vue.extend<Data, Methods, Computed>({
        name: "downloadResults",
        data() {
            return {
                uploadModalOpen: false,
                comparisonSwitch: switches.comparisonOutput
            }
        },
        computed: {
            hasUploadPermission: mapStateProp<ADRState, boolean>("adr", (state: ADRState) => state.userCanUpload),
            ...mapStateProps<DownloadResultsState, keyof ComputedFromDownloadResults>("downloadResults", {
                spectrum: (state => state.spectrum),
                summary: (state => state.summary),
                coarseOutput: (state => state.coarseOutput),
                comparison: (state => state.comparison)
            }),
            ...mapStateProps<ADRUploadState, keyof ComputedFromADRUpload>("adrUpload", {
                uploading: (state => state.uploading),
                uploadComplete: (state => state.uploadComplete),
                releaseCreated: (state => state.releaseCreated),
                releaseFailed: (state => state.releaseFailed),
                uploadError: (state => state.uploadError),
                currentFileUploading: (state => state.currentFileUploading),
                totalFilesUploading: (state => state.totalFilesUploading)
            }),
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
                    summary: {header: 'downloadSummaryReport', button: 'download'},
                    comparison: {header: 'downloadComparisonReport', button: 'download'}
                }
            },
            isPreparing() {
                return this.summary.preparing || this.spectrum.preparing || this.coarseOutput.preparing || this.comparison.preparing
            }
        },
        methods: {
            handleUploadModal() {
                this.uploadModalOpen = true;
            },
            clearStatus: mapMutationByName("adrUpload", "ClearStatus"),
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles"),
            prepareOutputs: mapActionByName("downloadResults", "prepareOutputs"),
            downloadComparisonReport: mapActionByName("downloadResults", "downloadComparisonReport"),
            downloadSpectrumOutput: mapActionByName("downloadResults", "downloadSpectrumOutput"),
            downloadSummaryReport: mapActionByName("downloadResults", "downloadSummaryReport"),
            downloadCoarseOutput: mapActionByName("downloadResults", "downloadCoarseOutput")
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
