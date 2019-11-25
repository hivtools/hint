<template>
    <div class="form-group">
        <label class="font-weight-bold">{{label}}</label>
        <tick color="#e31837" v-if="valid" width="20px"></tick>
        <a v-if="showRemove" class="small float-right" href="#" v-on:click="remove">remove</a>
        <loading-spinner v-if="uploading" size="xs"></loading-spinner>
        <slot></slot>
        <div class="custom-file">
            <input type="file"
                   class="custom-file-input"
                   :ref="name"
                   :id="name"
                   :accept="accept"
                   v-on:change="handleFileSelect"/>
            <label :for="name"
                   class="custom-file-label"
                   :disabled="uploading"
                   :class="{'selected': selectedFileName || existingFileName, 'uploading': uploading}">
                {{selectedFileName || existingFileName || "Choose a file" }}
            </label>
        </div>
        <error-alert v-if="hasError" :message="error"></error-alert>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import Tick from "./Tick.vue";
    import ErrorAlert from "./ErrorAlert.vue";
    import LoadingSpinner from "./LoadingSpinner.vue";

    interface Data {
        selectedFile: File | null
        selectedFileName: string,
        uploading: boolean
    }

    interface Computed {
        hasError: boolean
        showRemove: boolean
    }

    interface Methods {
        handleFileSelect: (_: Event, files: FileList | null) => void
        remove: () => void
    }

    interface Props {
        upload: (formData: FormData) => void,
        deleteFile: () => void,
        accept: string,
        label: string,
        valid: boolean,
        error: string,
        existingFileName: string,
        name: string
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "FileUpload",
        data(): Data {
            return {
                selectedFile: null,
                selectedFileName: "",
                uploading: false
            }
        },
        props: {
            "upload": Function,
            "deleteFile": Function,
            "accept": String,
            "label": String,
            "valid": Boolean,
            "error": String,
            "existingFileName": String,
            "name": String
        },
        computed: {
            hasError: function () {
                return this.error.length > 0
            },
            showRemove: function() {
                return this.hasError || this.valid
            }
        },
        methods: {
            handleFileSelect(_: Event, files: FileList | null) {
                if (!files) {
                    const fileInput = this.$refs[this.name] as HTMLInputElement;
                    files = fileInput.files
                }

                this.selectedFile = files && files[0];
                this.selectedFileName = this.selectedFile && this.selectedFile.name.split("\\").pop() || "";

                if (this.selectedFile) {
                    const formData = new FormData();
                    formData.append('file', this.selectedFile);
                    this.uploading = true;
                    this.upload(formData);
                }
            },
            remove() {
                this.deleteFile();
                this.selectedFile = null;
                this.selectedFileName = "";
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
            ErrorAlert
        }
    });


</script>