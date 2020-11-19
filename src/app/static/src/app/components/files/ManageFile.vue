<template>
    <div class="form-group">
        <label class="font-weight-bold mb-0" v-translate="label"></label>
        <tick color="#e31837" v-if="valid" width="20px"></tick>
        <span class="color-red" v-if="fromADR">ADR</span>
        <loading-spinner v-if="uploading" size="xs"></loading-spinner>
        <br/>
        <slot></slot>
        <label v-if="existingFileName || error" class="file-name">
            <span v-if="existingFileName">
                <strong v-translate="'file'"></strong>: {{ existingFileName }}
            </span>
            <a class="small float-right"
               href="#"
               v-on:click="handleFileDelete"
               v-translate="'remove'"></a>
        </label>
        <file-upload :name="name"
                     :accept="accept"
                     :upload="upload"
                     :uploading="uploading"
                     @uploading="handleUploading"></file-upload>
        <error-alert v-if="hasError" :error="error"></error-alert>
        <reset-confirmation :continue-editing="deleteSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showDeleteConfirmation"></reset-confirmation>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import FileUpload from "./FileUpload.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import Tick from "../Tick.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import ResetConfirmation from "../ResetConfirmation.vue";
    import {mapGetterByName} from "../../utils";
    import {Error} from "../../generated";

    interface Data {
        uploading: boolean
        showDeleteConfirmation: boolean
    }

    interface Computed {
        hasError: boolean
        editsRequireConfirmation: boolean
    }

    interface Methods {
        deleteSelectedFile: () => void
        handleFileDelete: () => void
        cancelEdit: () => void
        handleUploading: () => void
    }

    interface Props {
        upload: (formData: FormData) => void,
        deleteFile: () => void,
        accept: string,
        label: string,
        valid: boolean,
        error: Error,
        existingFileName: string,
        fromADR: boolean,
        name: string
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "FileSelect",
        props: {
            "upload": Function,
            "deleteFile": Function,
            "accept": String,
            "label": String,
            "valid": Boolean,
            "error": Object,
            "existingFileName": String,
            "fromADR": Boolean,
            "name": String
        },
        data(): Data {
            return {
                uploading: false,
                showDeleteConfirmation: false
            }
        },
        computed: {
            editsRequireConfirmation: mapGetterByName("stepper", "editsRequireConfirmation"),
            hasError: function () {
                return !!this.error
            }
        },
        components: {
            FileUpload,
            LoadingSpinner,
            Tick,
            ErrorAlert,
            ResetConfirmation
        },
        methods: {
            handleUploading() {
                this.uploading = true;
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
                this.showDeleteConfirmation = false;
            },
            cancelEdit() {
                this.showDeleteConfirmation = false;
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
        }
    });
</script>
