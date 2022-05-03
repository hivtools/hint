<template>
    <div id="dialog">
        <modal :open="true">
            <h4 v-translate="'uploadFileToAdr'"></h4>
            <div class="container">
                <div id="dataset-id" class="mt-4">
                    <span v-translate="'uploadFileDataset'"></span>
                    <span>{{ dataset }}</span></div>
                <div class="pt-3 form-check form-check-inline">
                    <input type="radio"
                           id="createRelease"
                           value="createRelease"
                           v-model="choiceUpload"
                           class="form-check-input"/>
                    <span class="form-check-label pl-2">
                        <label for="createRelease" v-translate="'createRelease'" class="d-inline"></label>
                        <span class="icon-small d-inline" v-tooltip="translate('createReleaseTooltip')">
                            <help-circle-icon></help-circle-icon>
                        </span>
                    </span>
                    <br/>
                </div>
                <div class="form-check form-check-inline">
                    <input type="radio"
                           id="uploadFiles"
                           value="uploadFiles"
                           v-model="choiceUpload"
                           class="form-check-input"/>
                    <span class="form-check-label pl-2">
                        <label for="uploadFiles" v-translate="'uploadFiles'" class="d-inline"></label>
                        <span class="icon-small d-inline" v-tooltip="translate('uploadFilesTooltip')">
                            <help-circle-icon></help-circle-icon>
                        </span>
                    </span>
                    <br/>
                </div>
                <div v-for="(uploadFileSection, sectionIndex) in uploadFileSections" :key="sectionIndex" class="pl-4">
                    <h5 v-if="Object.keys(uploadFileSections[1]).length > 0"
                        v-translate="sectionIndex === 0 ? 'outputFiles' : 'inputFiles'"
                        class="mt-3"></h5>
                    <div id="output-file-id" class="mt-3" v-for="(uploadFile, key, index) in uploadFileSection"
                         :key="uploadFile.index">
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
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
                    @click.prevent="confirmUpload"
                    :disabled="uploadFilesToAdr.length === 0"
                    v-translate="'ok'"></button>
                <button
                    type="button"
                    class="btn btn-white"
                    @click.prevent="handleCancel"
                    v-translate="'cancel'"></button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "../Modal.vue";
    import {
        Dict,
        UploadFile
    } from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import {HelpCircleIcon} from "vue-feather-icons";
    import {VTooltip} from "v-tooltip";
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";
    import {RootState} from "../../root";

    interface Methods {
        uploadFilesToADRAction: (selectedUploadFiles: { uploadFiles: UploadFile[], createRelease: boolean }) => void;
        confirmUpload: () => void;
        handleCancel: () => void
        setDefaultCheckedItems: () => void
        translate(text: string): string;
        sendUploadFilesToADR: () => void
    }

    interface Computed {
        dataset: string | undefined,
        uploadableFiles: Dict<UploadFile>,
        uploadFileSections: Array<Dict<UploadFile>>
        currentLanguage: Language;
        createRelease: boolean
    }

    interface Data {
        uploadFilesToAdr: string[]
        choiceUpload: "createRelease" | "uploadFiles"
        selectedUploadFiles: UploadFile[]
    }

    const outputFileTypes = ["outputZip", "outputSummary", "outComparison"];
    const inputFileTypes = ["anc", "programme", "pjnz", "population", "shape", "survey"];

    export default Vue.extend<Data, Methods, Computed, unknown>({
        name: "UploadModal",
        data(): Data {
            return {
                uploadFilesToAdr: [],
                choiceUpload: "createRelease",
                selectedUploadFiles: []
            }
        },
        methods: {
            uploadFilesToADRAction: mapActionByName<UploadFile[]>(
                "adrUpload",
                "uploadFilesToADR"
            ),
            confirmUpload() {
                this.selectedUploadFiles = this.uploadFilesToAdr.map(value => this.uploadableFiles[value]);
                this.sendUploadFilesToADR();
            },
            sendUploadFilesToADR() {
                this.uploadFilesToADRAction({uploadFiles: this.selectedUploadFiles, createRelease: this.createRelease});
                this.selectedUploadFiles = [];

                this.$emit("close");
            },
            handleCancel() {
                this.$emit("close")
            },
            translate(text) {
                return i18next.t(text, {lng: this.currentLanguage});
            },
            setDefaultCheckedItems: function () {
                this.uploadFilesToAdr = [...outputFileTypes, ...inputFileTypes]
                    .filter(key => this.uploadableFiles.hasOwnProperty(key))
            }
        },
        computed: {
            dataset: mapStateProp<BaselineState, string | undefined>("baseline",
                (state: BaselineState) => state.selectedDataset?.title),
            createRelease() {
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
            }
        },
        components: {
            Modal,
            HelpCircleIcon
        },
        watch: {
            choiceUpload() {
                if (this.createRelease) {
                    this.setDefaultCheckedItems()
                }
            }
        },
        directives: {
            tooltip: VTooltip,
        },
        mounted() {
            this.setDefaultCheckedItems()
        }
    });
</script>
