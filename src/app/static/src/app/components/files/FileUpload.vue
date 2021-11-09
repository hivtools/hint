<template>
    <div>
        <div class="custom-file">
            <input type="file"
                   style="display:none"
                   :ref="name"
                   :id="name"
                   :accept="accept"
                   :disabled="uploading"
                   v-on:change="handleFileSelect"/>
            <label :for="name"
                   class="custom-file-label"
                   :class="{'uploading': uploading}">
                <span v-translate="'selectNewFile'"></span>
            </label>
        </div>
        <reset-confirmation v-if="!dataExplorationMode"
                            :continue-editing="uploadSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showUploadConfirmation"></reset-confirmation>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapStatePropByName} from "../../utils";
    import ResetConfirmation from "../ResetConfirmation.vue";

    interface Methods {
        handleFileSelect: () => void
        uploadSelectedFile: () => void
        cancelEdit: () => void
    }

    interface Data {
        showUploadConfirmation: boolean
    }

    interface Computed {
        dataExplorationMode: boolean
        editsRequireConfirmation: boolean
    }

    interface Props {
        upload: (formData: FormData) => void,
        accept: string,
        name: string,
        uploading: boolean
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            "upload": Function,
            "accept": String,
            "name": String,
            "uploading": Boolean
        },
        data(): Data {
            return {
                showUploadConfirmation: false
            }
        },
        components: {
            ResetConfirmation
        },
        computed: {
            dataExplorationMode: mapStatePropByName(null, "dataExplorationMode"),
            editsRequireConfirmation() {
                if (this.dataExplorationMode){
                    return false
                }
                return this.$store.getters["stepper/editsRequireConfirmation"]
            }
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
                const selectedFile = fileInput.files![0]!;
                const formData = new FormData();
                formData.append('file', selectedFile);
                this.$emit("uploading");
                this.upload(formData);
                fileInput.value = "";
                this.showUploadConfirmation = false;
            },
            cancelEdit() {
                const fileInput = this.$refs[this.name] as HTMLInputElement;
                fileInput.value = "";
                this.showUploadConfirmation = false
            }
        }

    })
</script>