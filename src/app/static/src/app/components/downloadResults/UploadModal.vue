<template>
    <div id="dialog">
        <modal :open="open">
            <h4 v-translate="'uploadFileToAdr'"></h4>
            <div class="container">
                <div id="dataset-id" class="mt-4">
                    <span v-translate="'uploadFileDataset'"></span>
                    <span>{{ dataset }}</span></div>
                <div id="instructions" class="mt-3" v-translate="'uploadFileInstruction'"></div>
                <div id="output-file-id" class="mt-3" v-for="(uploadFile, key, index) in uploadFiles" :key="uploadFile.index">
                    <div class="mt-3 form-check">
                        <input class="form-check-input"
                               type="checkbox"
                               :value="key"
                               v-model="uploadFilesToAdr"
                               :id="`id-${index}`">

                        <label class="form-check-label"
                               :for="`id-${index}`"
                               v-translate="uploadFile.displayName"></label>

                        <small v-if="uploadFile.resourceId" class="text-danger row">
                        <span class="col-auto">
                        <span v-translate="'uploadFileOverwrite'"></span>{{ lastModified(uploadFile.lastModified) }}
                        </span>
                        </small>
                    </div>
                </div>
                <div class="mt-3">
                    <label for="description-id" v-translate="'uploadFileDesc'"></label>
                    <textarea v-model="uploadDescToAdr"
                              class="form-control" rows="3"
                              id="description-id"></textarea>
                </div>
            </div>
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
                    @click="confirmUpload"
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
    import {formatDateTime, mapActionByName, mapStateProp, mapStateProps, mapMutationByName} from "../../utils";
    import {ADRState} from "../../store/adr/adr";
    import {uploadFilesPayload} from "../../store/adr/actions";
    import {ADRMutation} from "../../store/adr/mutations";

    interface Methods {
        uploadFilestoADRAction: (uploadFilesPayload: uploadFilesPayload) => void;
        ADRUploadStarted: () => void;
        confirmUpload: () => void;
        handleCancel: () => void
        lastModified: (date: string) => string | null
        setDefaultCheckedItems: () => void
    }

    interface Computed {
        dataset: string
        uploadFiles: Dict<UploadFile>
    }

    interface Data {
        uploadFilesToAdr: string[]
        uploadDescToAdr: string
    }

    interface Props {
        open: boolean
    }

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
                uploadDescToAdr: ""
            }
        },
        methods: {
            ADRUploadStarted: mapMutationByName('adr', ADRMutation.ADRUploadStarted),
            uploadFilestoADRAction: mapActionByName<uploadFilesPayload>(
                'adr',
                'uploadFilestoADR'
            ),
            async confirmUpload() {
                const filesToBeUploaded: UploadFile[] = []
                this.uploadFilesToAdr.map(value => filesToBeUploaded.push(this.uploadFiles[value]))
                const uploadFilesPayload: uploadFilesPayload = {
                    filesToBeUploaded
                };
                console.log('uploadFilesPayload', uploadFilesPayload)
                this.ADRUploadStarted();
                this.uploadFilestoADRAction(uploadFilesPayload);
                this.$emit("close")
            },
            handleCancel() {
                this.$emit("close")
            },
            lastModified: function (date: string) {
                return formatDateTime(date)
            },
            setDefaultCheckedItems: function () {
                const uploadFilesKeys = ["outputZip", "outputSummary"]
                uploadFilesKeys.forEach(key => {
                    if (this.uploadFiles.hasOwnProperty(key)) {
                        this.uploadFilesToAdr.push(key)
                    }
                })
            }
        },
        computed: {
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                dataset: state => state.selectedDataset?.title
            }),
            uploadFiles: mapStateProp<ADRState, Dict<UploadFile>>("adr",
                (state: ADRState) => state.uploadFiles!
            )
        },
        components: {
            Modal
        },
        watch: {
            uploadFiles() {
                this.setDefaultCheckedItems()
            }
        }
    });
</script>

