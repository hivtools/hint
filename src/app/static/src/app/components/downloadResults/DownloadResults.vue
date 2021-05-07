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
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";
    import ErrorAlert from "../ErrorAlert.vue";
    import i18next from "i18next";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";

    interface Computed {
        modelCalibrateId: string,
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
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles")
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

