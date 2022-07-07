<template>
    <div id="project-upload-button">
        <a ref="uploadProject"
           class="btn btn-red"
           href="#"
           v-on:mousedown="$refs.uploadProject.click()"
           v-translate="'uploadFromZip'">
        </a>
        <input id="project-upload-input" v-translate:aria-label="'selectFile'"
               class="form-control"
               type="file"
               style="display: none;"
               ref="uploadProject"
               @change="uploadProject"
               accept=".zip">
    </div>
</template>

<script lang="ts">
    import Vue from "vue";

    interface Props {
        uploadProject: (e: Event) => void
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "ProjectUploadButton",
        props: {
            uploadProject: Function
        }
    })
</script>
