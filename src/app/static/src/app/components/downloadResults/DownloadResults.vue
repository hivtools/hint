<template>
    <div class="container">
        <div class="row">
            <div class="col-sm">
                <template v-for="type in Object.values(DownloadType)" :key="type">
                    <div :id="`${type}-download`" v-if="switches[type]">
                        <download :translate-key="getDownloadTranslationKey(type)"
                                  @trigger-download="() => downloadOutput(type)"
                                  :disabled="!state[type].downloadId || state[type].preparing"
                                  :file="state[type]"/>
                        <div class="pb-2">
                            <error-alert v-if="state[type].downloadError" :error="state[type].downloadError"></error-alert>
                        </div>
                    </div>
                </template>
            </div>
            <div id="upload" v-if="hasUploadPermission" class="col-sm">
                <h4 v-translate="'uploadFileToAdr'"></h4>
                <button @click.prevent="handleUploadModal"
                        class="btn btn-lg my-3"
                        :class="uploading || isPreparing ? 'btn-secondary' : 'btn-red'"
                        :disabled="uploading || isPreparing">
                    <span v-translate="'upload'"></span>
                    <vue-feather type="upload" size="20" class="icon ml-2" style="margin-top: -4px;"></vue-feather>
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
    import {mapActionByName, mapStateProp, mapMutationByName, mapStateProps} from "../../utils";
    import VueFeather from "vue-feather";
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
    import Download from "./Download.vue";
    import { defineComponent } from "vue";
    import { downloadSwitches, DownloadType, getDownloadTranslationKey } from "../../store/downloadResults/downloadConfig";

    interface Data {
        uploadModalOpen: boolean,
        DownloadType: typeof DownloadType,
        switches: {
            [K in DownloadType]: boolean
        },
        getDownloadTranslationKey: typeof getDownloadTranslationKey
    }

    export default defineComponent({
        name: "downloadResults",
        data(): Data {
            return {
                uploadModalOpen: false,
                switches: downloadSwitches,
                DownloadType,
                getDownloadTranslationKey
            }
        },
        computed: {
            hasUploadPermission: mapStateProp<ADRState, boolean>("adr", (state: ADRState) => state.userCanUpload),
            ...mapStateProps("downloadResults", {
                state: (state) => state
            }),
            ...mapStateProps("adrUpload", {
                uploading: ((state: ADRUploadState) => state.uploading),
                uploadComplete: ((state: ADRUploadState) => state.uploadComplete),
                releaseCreated: ((state: ADRUploadState) => state.releaseCreated),
                releaseFailed: ((state: ADRUploadState) => state.releaseFailed),
                uploadError: ((state: ADRUploadState) => state.uploadError),
                currentFileUploading: ((state: ADRUploadState) => state.currentFileUploading),
                totalFilesUploading: ((state: ADRUploadState) => state.totalFilesUploading)
            }),
            uploadingStatus(): string {
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
            isPreparing(): boolean {
                return Object.values(DownloadType).some(type => this.state[type].preparing);
            }
        },
        methods: {
            handleUploadModal() {
                this.uploadModalOpen = true;
            },
            clearStatus: mapMutationByName("adrUpload", "ClearStatus"),
            getUserCanUpload: mapActionByName("adr", "getUserCanUpload"),
            getUploadFiles: mapActionByName("adrUpload", "getUploadFiles"),
            prepareAllOutputs: mapActionByName("downloadResults", "prepareAllOutputs"),
            downloadOutput: mapActionByName("downloadResults", "downloadOutput"),
        },
        mounted() {
            this.getUserCanUpload();
            this.getUploadFiles();
            this.prepareAllOutputs();
        },
        beforeMount() {
            this.clearStatus();
        },
        components: {
            VueFeather,
            LoadingSpinner,
            Tick,
            Cross,
            ErrorAlert,
            UploadModal,
            Download
        }
    });
</script>
