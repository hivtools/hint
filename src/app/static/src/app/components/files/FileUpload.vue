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
        <reset-confirmation :discard-step-warning="modelOptions"
                            :continue-editing="uploadSelectedFile"
                            :cancel-editing="cancelEdit"
                            :open="showUploadConfirmation"></reset-confirmation>
    </div>
</template>

<script lang="ts">
    import ResetConfirmation from "../resetConfirmation/ResetConfirmation.vue";
    import ResetConfirmationMixin from "../resetConfirmation/ResetConfirmationMixin"
    import {Step} from "../../types";
    import { PropType, defineComponent } from "vue";

    interface Data {
        showUploadConfirmation: boolean
        modelOptions: number
    }

    export default defineComponent({
        extends: ResetConfirmationMixin,
        props: {
            upload: {
                type: Function as PropType<(formData: FormData) => void>,
                required: true
            },
            accept: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            uploading: {
                type: Boolean,
                required: true
            }
        },
        data(): Data {
            return {
                showUploadConfirmation: false,
                modelOptions: Step.ModelOptions
            }
        },
        components: {
            ResetConfirmation
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
