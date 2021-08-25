<template>
    <div id="dialog">
        <modal :open="open">
            <h4 v-translate="'uploadFileToAdr'"></h4>
            <div class="container">
                <div id="dataset-id" class="mt-4">
                    <span v-translate="'uploadFileDataset'"></span>
                    <span>{{ dataset }}</span></div>
                <div class="pt-3">
                    <input
                        type="radio"
                        id="createRelease"
                        value="createRelease"
                        v-model="choiceUpload"
                    />
                    <label for="createRelease" v-translate="'createRelease'" class="pr-1"></label>
                    <span class="icon-small" v-tooltip="translate('createReleaseTooltip')">
                        <help-circle-icon></help-circle-icon>
                    </span>
                    <br />
                </div>
                <div>
                    <input
                        type="radio"
                        id="uploadFiles"
                        value="uploadFiles"
                        v-model="choiceUpload"
                    />
                    <label
                        for="uploadFiles"
                        v-translate="'uploadFiles'"
                        class="pr-1"
                    ></label>
                    <span class="icon-small" v-tooltip="translate('uploadFilesTooltip')">
                        <help-circle-icon></help-circle-icon>
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
                                   :disabled="choiceUpload === 'createRelease'"
                                   :value="key"
                                   v-model="uploadFilesToAdr"
                                   :id="`id-${sectionIndex}-${index}`">

                            <label class="form-check-label"
                                   :for="`id-${sectionIndex}-${index}`"
                                   v-translate="uploadFile.displayName"></label>
                            <small v-if="uploadFile.resourceId" class="text-danger row">
                            <span class="col-auto">
                            <span v-translate="'uploadFileOverwrite'"></span>{{ lastModified(uploadFile.lastModified) }}
                            </span>
                            </small>
                        </div>
                    </div>
                </div>
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
                    @click.prevent="handleCancel"
                    v-translate="'cancel'"></button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "../Modal.vue";
    import {Dict, UploadFile} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {formatDateTime, mapActionByName, mapStateProp, mapStateProps} from "../../utils";
    import {ADRUploadState} from "../../store/adrUpload/adrUpload";
    import { HelpCircleIcon } from "vue-feather-icons";
    import { VTooltip } from "v-tooltip";
    import i18next from "i18next";
    import { Language } from "../../store/translations/locales";
    import { RootState } from "../../root";

    interface Methods {
        uploadFilesToADRAction: (uploadFilesPayload: {uploadFiles: UploadFile[], createRelease: boolean}) => void;
        createReleaseAction: () => void;
        confirmUpload: () => void;
        handleCancel: () => void
        lastModified: (date: string) => string | null
        setDefaultCheckedItems: () => void
        translate(text: string): string;
    }

    interface Computed {
        dataset: string
        uploadFiles: Dict<UploadFile>,
        uploadFileSections: Array<Dict<UploadFile>>
        currentLanguage: Language;
        uploadDisabled: boolean;
    }

    interface Data {
        uploadFilesToAdr: string[]
        uploadDescToAdr: string
        choiceUpload: "createRelease" | "uploadFiles"
    }

    interface Props {
        open: boolean
    }

    const outputFileTypes = ["outputZip", "outputSummary"];
    const inputFileTypes = ["anc", "programme", "pjnz", "population", "shape", "survey"];

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "UploadModal",
        props: {
            open: {
                type: Boolean
            }
        },
        data(): Data {
            return {
                uploadFilesToAdr: [],
                uploadDescToAdr: "",
                choiceUpload: "createRelease"
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
            confirmUpload() {
                const uploadFiles: UploadFile[] = []
                this.uploadFilesToAdr.forEach(value => uploadFiles.push(this.uploadFiles[value]))
                this.uploadFilesToADRAction({uploadFiles, createRelease: this.choiceUpload === 'createRelease'});
                this.$emit("close")
            },
            handleCancel() {
                this.$emit("close")
            },
            lastModified: function (date: string) {
                return formatDateTime(date)
            },
            translate(text) {
                return i18next.t(text, { lng: this.currentLanguage });
            },
            setDefaultCheckedItems: function () {
                this.uploadFilesToAdr = [...outputFileTypes, ...inputFileTypes]
                    .filter(key => this.uploadFiles.hasOwnProperty(key))
            }
        },
        computed: {
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                dataset: state => state.selectedDataset?.title
            }),
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
            uploadFiles: mapStateProp<ADRUploadState, Dict<UploadFile>>("adrUpload",
                (state) => state.uploadFiles!
            ),
            uploadFileSections() {
                if (this.uploadFiles) {
                    return Object.keys(this.uploadFiles).reduce((sections, key) => {
                        if (outputFileTypes.includes(key)) {
                            sections[0][key] = this.uploadFiles[key];
                        } else {
                            sections[1][key] = this.uploadFiles[key];
                        }
                        return sections;
                    }, [{} as any, {} as any]);
                } else {
                    return [];
                }
            },
            uploadDisabled(){
                if (this.choiceUpload === 'uploadFiles' && this.uploadFilesToAdr.length < 1){
                    return true
                } else {
                    return false
                }
            }
        },
        components: {
            Modal,
            HelpCircleIcon,
        },
        watch: {
            uploadFiles() {
                this.setDefaultCheckedItems()
            },
            choiceUpload(){
                if (this.choiceUpload === 'createRelease'){
                    this.setDefaultCheckedItems()
                }
            }
        },
        directives: {
            tooltip: VTooltip,
        },
    });
</script>

