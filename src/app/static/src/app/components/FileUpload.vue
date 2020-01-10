<template>
    <div class="form-group">
        <label class="font-weight-bold" v-translate="label"></label>
        <tick color="#e31837" v-if="valid" width="20px"></tick>
        <a v-if="showRemove" class="small float-right" href="#" v-on:click="handleFileDelete" v-translate="'remove'"></a>
        <loading-spinner v-if="uploading" size="xs"></loading-spinner>
        <slot></slot>
        <div class="custom-file">
            <input type="file"
                   title=""
                   class="custom-file-input"
                   :ref="name"
                   :id="name"
                   :accept="accept"
                   v-on:change="handleFileSelect"/>
            <label :for="name"
                   class="custom-file-label"
                   :disabled="uploading"
                   :class="{'selected': selectedFileName || existingFileName, 'uploading': uploading}">
                <span v-if="selectedFileName || existingFileName"> {{selectedFileName || existingFileName}}</span>
                <span v-if="!selectedFileName && !existingFileName" v-translate="'chooseFile'"></span>
            </label>
        </div>
        <error-alert v-if="hasError" :error="error"></error-alert>
        <reset-confirmation :continue-editing="uploadSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showUploadConfirmation"></reset-confirmation>
        <reset-confirmation :continue-editing="deleteSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showDeleteConfirmation"></reset-confirmation>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import Tick from "./Tick.vue";
    import ErrorAlert from "./ErrorAlert.vue";
    import LoadingSpinner from "./LoadingSpinner.vue";
    import {mapGetterByName} from "../utils";
    import {Error} from "../generated";
    import ResetConfirmation from "./ResetConfirmation.vue";

    interface Data {
        selectedFile: File | null
        selectedFileName: string,
        uploading: boolean,
        showUploadConfirmation: boolean,
        showDeleteConfirmation: boolean
    }

    interface Computed {
        hasError: boolean
        showRemove: boolean,
        editsRequireConfirmation: boolean
    }

    interface Methods {
        handleFileSelect: () => void
        deleteSelectedFile: () => void
        handleFileDelete: () => void
        uploadSelectedFile: () => void
        cancelEdit: () => void
    }

    interface Props {
        upload: (formData: FormData) => void,
        deleteFile: () => void,
        accept: string,
        label: string,
        valid: boolean,
        error: Error,
        existingFileName: string,
        name: string
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "FileUpload",
        data(): Data {
            return {
                selectedFile: null,
                selectedFileName: "",
                uploading: false,
                showUploadConfirmation: false,
                showDeleteConfirmation: false
            }
        },
        props: {
            "upload": Function,
            "deleteFile": Function,
            "accept": String,
            "label": String,
            "valid": Boolean,
            "error": Object,
            "existingFileName": String,
            "name": String
        },
        computed: {
            hasError: function () {
                return !!this.error
            },
            showRemove: function () {
                return this.hasError || this.valid
            },
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation")
        },
        methods: {
            handleFileSelect() {
                if (this.editsRequireConfirmation) {
                    this.showUploadConfirmation = true;
                } else {
                    this.uploadSelectedFile();
                }
            },
            uploadSelectedFile() {
                const fileInput = this.$refs[this.name] as HTMLInputElement;
                this.selectedFile = fileInput.files!![0]!!;
                this.selectedFileName = this.selectedFile.name.split("\\").pop() || "";

                const formData = new FormData();
                formData.append('file', this.selectedFile);
                this.uploading = true;
                this.upload(formData);
                this.showUploadConfirmation = false;
            },
            handleFileDelete() {
                if (this.editsRequireConfirmation) {
                    this.showDeleteConfirmation = true;
                } else {
                    this.deleteSelectedFile();
                }
            },
            deleteSelectedFile() {
                this.deleteFile();
                this.selectedFile = null;
                this.selectedFileName = "";
                (this.$refs[this.name] as HTMLInputElement).value = "";
                this.showDeleteConfirmation = false;
            },
            cancelEdit() {
                this.showDeleteConfirmation = false;
                this.showUploadConfirmation = false
            }
        },
        watch: {
            valid: function (newVal: boolean) {
                if (newVal) {
                    this.uploading = false;
                }
            },
            error: function (newVal: string) {
                if (newVal) {
                    this.uploading = false;
                }
            }
        },
        components: {
            Tick,
            LoadingSpinner,
            ErrorAlert,
            ResetConfirmation
        }
    });

</script>
