<template>
    <div id="test-clicker">
        <a ref="uploadProject"
           class="btn btn-red"
           href="#"
           v-on:mousedown="$refs.uploadProject.click()"
           v-translate="'Upload project from zip'">
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

    export default Vue.extend({
        name: "ProjectUploadButton",
        props: {
            uploadProject: Function
        }
    })
</script>
