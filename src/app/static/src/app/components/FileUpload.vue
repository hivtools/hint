<template>
    <div class="form-group">
        <label class="font-weight-bold">{{label}}</label>
        <tick color="#e31837" v-if="valid" width="20px"></tick>
        <div class="custom-file">
            <input type="file"
                   class="custom-file-input"
                   :ref="name"
                   :id="name"
                   :accept="accept"
                   v-on:change="handleFileSelect"/>
            <label :for="name" :class="['custom-file-label', {'selected': newFileName || existingFileName}]">
                {{newFileName || existingFileName || "Choose a file" }}
            </label>
        </div>
        <error-alert v-if="hasError" :message="error"></error-alert>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    import Tick from "./Tick.vue";
    import ErrorAlert from "./ErrorAlert.vue";

    interface Data {
        newFile: File | null
        newFileName: string
    }

    interface Computed {
        hasError: boolean
    }

    interface Methods {
        handleFileSelect: (_: Event, files: FileList | null) => void
    }

    type PropNames = "upload" | "accept" | "label" | "valid" | "error" | "existingFileName" | "name"

    export default Vue.extend<Data, Methods, Computed, PropNames>({
        name: "FileUpload",
        data(): Data {
            return {
                newFile: null,
                newFileName: ""
            }
        },
        props: ["upload", "accept", "label", "valid", "error", "existingFileName", "name"],
        computed: {
            hasError: function () {
                return this.error.length > 0
            }
        },
        methods: {
            handleFileSelect(_: Event, files: FileList | null) {
                if (!files) {
                    const fileInput = this.$refs[this.name] as HTMLInputElement;
                    files = fileInput.files
                }

                this.newFile = files && files[0];
                this.newFileName = this.newFile && this.newFile.name.split("\\").pop() || "";

                if (this.newFile) {
                    this.upload(this.newFile);
                }
            }
        },
        components: {
            Tick,
            ErrorAlert
        }
    });


</script>