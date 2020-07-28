<template>
    <a class="dropdown-item" href="#" v-on:mousedown="$refs[name].click()">
        <input type="file"
               style="display:none"
               :ref="name"
               :id="name"
               :accept="accept"
               v-on:change="handleFileSelect"/>
        This computer
    </a>
</template>

<script lang="ts">
    import Vue from "vue";
    import {BDropdownItem} from "bootstrap-vue";
    import {mapGetterByName} from "../../utils";
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
                showUploadConfirmation: false
            }
        },
        components: {
            BDropdownItem,
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