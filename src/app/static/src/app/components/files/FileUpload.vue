<template>
    <div>
        <div class="custom-file">
            <input type="file"
                   style="display:none"
                   :ref="name"
                   :id="name"
                   :accept="accept"
                   v-on:change="handleFileSelect"/>
            <label :for="name"
                   class="custom-file-label"
                   :disabled="uploading"
                   :class="{'uploading': uploading}">
                <span v-translate="'selectNewFile'"></span>
            </label>
        </div>
        <reset-confirmation :continue-editing="uploadSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showUploadConfirmation"></reset-confirmation>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BDropdown} from "bootstrap-vue";
    import {mapGetterByName} from "../../utils";
    import ResetConfirmation from "../ResetConfirmation.vue";

    interface Methods {
        handleFileSelect: () => void
        uploadSelectedFile: () => void
        cancelEdit: () => void
    }

    interface Data {
        showUploadConfirmation: boolean
        uploading: boolean
    }

    interface Computed {
        editsRequireConfirmation: boolean
    }

    interface Props {
        upload: (formData: FormData) => void,
        accept: string,
        name: string
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            "upload": Function,
            "accept": String,
            "name": String
        },
        data(): Data {
            return {
                showUploadConfirmation: false,
                uploading: true
            }
        },
        components: {
            BDropdown,
            ResetConfirmation
        },
        computed: {
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
                const selectedFile = fileInput.files!![0]!!;
                const formData = new FormData();
                formData.append('file', selectedFile);
                this.uploading = true;
                this.$emit("uploading");
                this.upload(formData);
                fileInput.value = "";
                this.showUploadConfirmation = false;
            },
            cancelEdit() {
                this.showUploadConfirmation = false
            }
        }

    })
</script>