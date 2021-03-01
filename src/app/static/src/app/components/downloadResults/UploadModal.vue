<template>
    <div>
        <modal :open="open">
            <h4 v-translate="'uploadToAdr'"></h4>
            <div class="container">
                <div class="mt-4">
                    <span v-translate="'uploadDataset'"></span>
                    <span>Antarctica (Naomi test data)</span></div>
                <div class="mt-3" v-translate="'uploadInstruction'"></div>
                <div class="mt-3">
                    <input class="form-check-input" type="checkbox"
                           v-model="uploadModelToAdr" id="model-upload-adr">
                    <label class="form-check-label" for="model-upload-adr"
                           v-translate="'uploadModelToAdr'"> </label>
                    <small class="text-danger d-flex"> danger</small>
                </div>
                <div class="mt-2">
                    <input class="form-check-input" type="checkbox"
                           v-model="uploadSummaryToAdr" id="summary-upload-adr">
                    <label class="form-check-label" for="summary-upload-adr"
                           v-translate="'uploadSummaryToAdr'"></label>
                    <small class="text-danger d-flex"> danger</small>
                </div>
                <div class="mt-2">
                    <input class="form-check-input" type="checkbox"
                           v-model="uploadPopulationToAdr" id="population-upload-adr">
                    <label class="form-check-label" for="population-upload-adr"
                           v-translate="'uploadPopulationToAdr'"></label>
                    <small class="text-danger d-flex">This file already exists on ADR and will
                        be overwritten. File was updated 24/02/21 17:22 by Jeff</small>
                </div>
                <div class="mt-2">
                    <input class="form-check-input" type="checkbox"
                           v-model="uploadArtToAdr" id="art-upload-adr">
                    <label class="form-check-label" for="art-upload-adr"
                           v-translate="'uploadArtToAdr'"></label>
                    <small class="text-danger d-flex"> danger</small>
                </div>
                <div class="mt-2">
                    <label for="desc-upload-adr" v-translate="'uploadDescToAdr'"></label>
                    <textarea v-model="uploadDescToAdr" class="form-control" rows="4" id="desc-upload-adr"></textarea>
                </div>
            </div>
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
                    @click.prevent="handleUploads"
                    v-translate="'ok'"></button>
                <button
                    type="button"
                    class="btn btn-white"
                    @click.prevent="handleCancel"
                    v-translate="'cancel'"></button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "../Modal.vue";

    interface Computed {
        uploadSelected: void
    }

    interface Methods {
        handleCancel: () => void
        handleUploads: () => void
    }

    interface Data {
        uploadArtToAdr: string,
        uploadDescToAdr: string,
        uploadModelToAdr: string,
        uploadSummaryToAdr: string,
        uploadPopulationToAdr: string
    }

    interface Props {
        open: boolean,
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "UploadModal",
        props: {
            open: {
                type: Boolean,
                required: true
            }
        },
        data() {
            return {
                uploadArtToAdr: "checked",
                uploadDescToAdr: "",
                uploadModelToAdr: "checked",
                uploadSummaryToAdr: "checked",
                uploadPopulationToAdr: "checked"
            }
        },
        computed: {
            uploadSelected: function () {
            }
        },
        methods: {
            handleCancel() {
               this.$emit("close")
            },
            handleUploads() {
                this.$emit("submit")
            }
        },
        components: {
            Modal
        }
    });
</script>

