<template>
    <div>
        <modal id="upload-progress" :open="openModal">
            <div>
                <h4 v-translate="headerText"></h4>
                <loading-spinner size="xs"/>
            </div>
            <span v-translate="progressMessage"></span>
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
            headerText: String,
            progressMessage: String,
            cancel: Function
        },
        components: {
            LoadingSpinner,
            Modal
        }
    })
</script>
