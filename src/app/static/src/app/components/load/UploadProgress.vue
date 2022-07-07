<template>
    <div id="upload-progress">
        <modal :open="openModal">
            <h4 class="pb-4">
                <span id="upload-header" class="pr-2" v-translate="'uploadFromZip'"></span>
                <span><loading-spinner size="xs"/></span>
            </h4>
            <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                     role="progressbar"
                     aria-valuenow="100"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     style="width: 100%"/>
            </div>
            <span id="progress-message" v-translate="'uploading'"></span>
            <template v-slot:footer>
                <button id="cancel-upload-progress"
                        type="button"
                        class="btn btn-white"
                        @click="cancel"
                        v-translate="'cancel'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import Modal from "../Modal.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";

    export default Vue.extend({
        name: "UploadProgress",
        props: {
            openModal: Boolean,
            cancel: Function
        },
        components: {
            LoadingSpinner,
            Modal
        }
    })
</script>
