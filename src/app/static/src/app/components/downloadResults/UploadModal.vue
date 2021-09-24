<template>
    <div id="dialog">
        <modal :open="true">
            <h4 v-translate="'uploadFileToAdr'"></h4>
            <div class="container">
                <div id="dataset-id" class="mt-4">
                    <span v-translate="'uploadFileDataset'"></span>
                    <span>{{ dataset }}</span></div>
                <div class="pt-3 form-check form-check-inline">
                    <input
                        type="radio"
                        id="createRelease"
                        value="createRelease"
                        v-model="choiceUpload"
                        class="form-check-input"
                    />
                    <span class="form-check-label pl-2">
                        <label for="createRelease" v-translate="'createRelease'" class="d-inline"></label>
                        <span class="icon-small d-inline" v-tooltip="translate('createReleaseTooltip')">
                            <help-circle-icon></help-circle-icon>
                        </span>
                    </span>
                    <br />
                </div>
                <div class="form-check form-check-inline">
                    <input
                        type="radio"
                        id="uploadFiles"
                        value="uploadFiles"
                        v-model="choiceUpload"
                        class="form-check-input"
                    />
                    <span class="form-check-label pl-2">
                        <label for="uploadFiles" v-translate="'uploadFiles'" class="d-inline"></label>
                        <span class="icon-small d-inline" v-tooltip="translate('uploadFilesTooltip')">
                            <help-circle-icon></help-circle-icon>
                        </span>
                    </span>
                    <br />
                </div>
                <div v-for="(uploadFileSection, sectionIndex) in uploadFileSections" :key="sectionIndex" class="pl-4">
                    <h5 v-if="Object.keys(uploadFileSections[1]).length > 0"
                        v-translate="sectionIndex === 0 ? 'outputFiles' : 'inputFiles'"
                        class="mt-3"></h5>
                    <div id="output-file-id" class="mt-3" v-for="(uploadFile, key, index) in uploadFileSection" :key="uploadFile.index">
                        <div class="mt-3 form-check">
                            <input class="form-check-input"
                                   type="checkbox"
                                   :disabled="createRelease"
                                   :value="key"
                                   v-model="uploadFilesToAdr"
                                   :id="`id-${sectionIndex}-${index}`">

                            <label class="form-check-label"
                                   :for="`id-${sectionIndex}-${index}`"
                                   v-translate="uploadFile.displayName"></label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pt-3">
                <download-progress id="upload-download-progress"
                                   :translate-key="'downloadProgressForADR'"
                                   :downloading="downloadingFiles"/>
            </div>
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
                    :disabled="uploadDisabled"
                    @click.prevent="confirmUpload"
                    v-translate="'ok'"></button>
                <button
                    type="button"
                    class="btn btn-white"
                    :disabled="downloadingFiles"
                    @click.prevent="handleCancel"
                    v-translate="'cancel'"></button>
                    <button
                    type="button"
                    class="btn btn-white"
                    @click.prevent="deleteReleaseAction">Delete release</button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "../Modal.vue";
    import {
        Dict,
        DownloadResultsDependency,
        SelectedADRUploadFiles,
        UploadFile
    } from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import { HelpCircleIcon } from "vue-feather-icons";
    import { VTooltip } from "v-tooltip";
    import i18next from "i18next";
    import { Language } from "../../store/translations/locales";
    import { RootState } from "../../root";
    import {DownloadResultsState} from "../../store/downloadResults/downloadResults";
    import {ADRState} from "../../store/adr/adr";
    import DownloadProgress from "./DownloadProgress.vue";

    interface Methods {
        uploadFilesToADRAction: (selectedUploadFiles: {uploadFiles: UploadFile[], createRelease: boolean}) => void;
        createReleaseAction: () => void;
        deleteReleaseAction: () => void;
        confirmUpload: () => void;
        handleCancel: () => void
        setDefaultCheckedItems: () => void
        translate(text: string): string;
        downloadSpectrum: () => void
        downloadSummary: () => void
        prepareFilesForUpload: () => boolean
        findSelectedUploadFiles: () => SelectedADRUploadFiles
        downloadIsReady: () => boolean
        getSummaryDownload: () => void
        getSpectrumDownload: () => void
        sendUploadFilesToADR: () => void
        getUploadMetadata: (id: string) => Promise<void>
        handleDownloadResult: (downloadResults: DownloadResultsDependency) => void,
        stopPolling:(id: number) => void
    }

    interface Computed {
        dataset: string
        uploadableFiles: Dict<UploadFile>,
        uploadFileSections: Array<Dict<UploadFile>>
        currentLanguage: Language;
        uploadDisabled: boolean;
        spectrum: Partial<DownloadResultsDependency>,
        summary: Partial<DownloadResultsDependency>,
        outputSummary: string,
        outputSpectrum: string,
        downloadingFiles: boolean
        createRelease: boolean
    }

    interface Data {
        uploadFilesToAdr: string[]
        uploadDescToAdr: string
        choiceUpload: "createRelease" | "uploadFiles"
        selectedUploadFiles: UploadFile[]
    }

    const outputFileTypes = ["outputZip", "outputSummary"];
    const inputFileTypes = ["anc", "programme", "pjnz", "population", "shape", "survey"];

    export default Vue.extend<Data, Methods, Computed, unknown>({
        name: "UploadModal",
        data(): Data {
            return {
                uploadFilesToAdr: [],
                uploadDescToAdr: "",
                choiceUpload: "createRelease",
                selectedUploadFiles: []
            }
        },
        methods: {
            uploadFilesToADRAction: mapActionByName<UploadFile[]>(
                "adrUpload",
                "uploadFilesToADR"
            ),
            createReleaseAction: mapActionByName(
                "adrUpload",
                "createRelease"
            ),
            deleteReleaseAction: mapActionByName(
                "adrUpload",
                "deleteRelease"
            ),
            confirmUpload() {
                this.selectedUploadFiles = this.uploadFilesToAdr.map(value => this.uploadableFiles[value]);
                const readyForUpload = this.prepareFilesForUpload();

                if (readyForUpload) {
                    this.sendUploadFilesToADR();
                }
            },
            sendUploadFilesToADR() {
                this.uploadFilesToADRAction({uploadFiles: this.selectedUploadFiles, createRelease: this.createRelease});
                this.selectedUploadFiles = [];

                this.$emit("close");
            },
            prepareFilesForUpload() {
                const {summary, spectrum} = this.findSelectedUploadFiles();
                if (summary) {
                    this.getSummaryDownload();
                }
                if (spectrum) {
                    this.getSpectrumDownload();
                }

                return this.downloadIsReady();
            },
            findSelectedUploadFiles() {
                const summary = this.selectedUploadFiles.find(upload => upload.resourceType === this.outputSummary);
                const spectrum = this.selectedUploadFiles.find(upload => upload.resourceType === this.outputSpectrum);

                return {summary, spectrum}
            },
            downloadIsReady() {
                const {summary, spectrum} = this.findSelectedUploadFiles();
                return (summary || spectrum) && (!summary || !!this.summary.complete) && (!spectrum || !!this.spectrum.complete);
            },
            getSummaryDownload() {
                if (!this.summary.downloading && !this.summary.complete) {
                    this.downloadSummary();
                }
            },
            getSpectrumDownload() {
                if (!this.spectrum.downloading && !this.spectrum.complete) {
                    this.downloadSpectrum();
                }
            },
            handleCancel() {
                this.$emit("close")
            },
            translate(text) {
                return i18next.t(text, { lng: this.currentLanguage });
            },
            setDefaultCheckedItems: function () {
                this.uploadFilesToAdr = [...outputFileTypes, ...inputFileTypes]
                    .filter(key => this.uploadableFiles.hasOwnProperty(key))
            },
            stopPolling(id) {
                clearInterval(id)
            },
            async handleDownloadResult(downloadResults) {
                if (this.downloadIsReady()) {
                    await this.getUploadMetadata(downloadResults.downloadId)
                    this.sendUploadFilesToADR();
                }

                if(downloadResults.complete) {
                    this.stopPolling(downloadResults.statusPollId)
                }

                if (downloadResults.error) {
                    this.stopPolling(downloadResults.statusPollId)
                }
            },
            downloadSpectrum: mapActionByName("downloadResults", "downloadSpectrum"),
            downloadSummary: mapActionByName("downloadResults", "downloadSummary"),
            getUploadMetadata: mapActionByName("metadata", "getAdrUploadMetadata")
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
                })
            }),
            ...mapStateProps<ADRState, keyof Computed>("adr", {
                outputSpectrum: state => state.schemas?.outputZip,
                outputSummary: state => state.schemas?.outputSummary
            }),
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                dataset: state => state.selectedDataset?.title
            }),
            createRelease(){
                return this.choiceUpload === 'createRelease';
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            uploadableFiles: mapStateProp<ADRUploadState, Dict<UploadFile>>("adrUpload",
                (state) => state.uploadFiles!
            ),
            uploadFileSections() {
                if (this.uploadableFiles) {
                    return Object.keys(this.uploadableFiles).reduce((sections, key) => {
                        if (outputFileTypes.includes(key)) {
                            sections[0][key] = this.uploadableFiles[key];
                        } else {
                            sections[1][key] = this.uploadableFiles[key];
                        }
                        return sections;
                    }, [{} as any, {} as any]);
                } else {
                    return [];
                }
            },
            uploadDisabled(){
                return !this.uploadFilesToAdr.length || this.downloadingFiles;
            },
            downloadingFiles() {
                return !!this.spectrum.downloading || !!this.summary.downloading;
            }
        },
        components: {
            Modal,
            HelpCircleIcon,
            DownloadProgress
        },
        watch: {
            choiceUpload(){
                if (this.createRelease){
                    this.setDefaultCheckedItems()
                }
            },
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
            }
        },
        directives: {
            tooltip: VTooltip,
        },
        mounted(){
            this.setDefaultCheckedItems()
        }
    });
</script>

