<template>
    <div class="form-group">
        <label class="font-weight-bold" v-translate="label"></label>
        <tick color="#e31837" v-if="valid" width="20px"></tick>
        <slot></slot>
        <label v-if="existingFileName"><strong v-translate="'file'"></strong>: {{existingFileName}}</label>
        <a v-if="existingFileName"
           class="small float-right"
           href="#"
           v-on:click="handleFileDelete"
           v-translate="'remove'"></a>
        <loading-spinner v-if="uploading" size="xs"></loading-spinner>
        <error-alert v-if="hasError" :error="error"></error-alert>
        <div>
            <b-dropdown text="Select file from" variant="red">
                <file-upload :accept="accept"
                             :name="name"
                             :upload="upload"
                             @uploading="handleUploading"></file-upload>
                <adr-select></adr-select>
            </b-dropdown>
        </div>
        <reset-confirmation :continue-editing="deleteSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showDeleteConfirmation"></reset-confirmation>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {BDropdown} from "bootstrap-vue";
    import AdrSelect from "./ADRSelect.vue";
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
            BDropdown,
            FileUpload,
            AdrSelect,
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
