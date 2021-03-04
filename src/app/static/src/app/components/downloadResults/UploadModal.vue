<template>
    <div id="dialog">
        <modal :open="open">
            <h4 v-translate="'outputFileToAdr'"></h4>
            <div class="container">
                <div id="dataset-id" class="mt-4">
                    <span v-translate="'outputFileDataset'"></span>
                    <span>{{ dataset }}</span></div>
                <div id="instructions" class="mt-3" v-translate="'outputFileInstruction'"></div>
                <div id="output-file-id" class="mt-3" v-for="(output, index) in outputFileMetadata" :key="index">
                    <div class="mt-3 form-check">
                        <input class="form-check-input"
                               type="checkbox"
                               :value="index"
                               v-model="pushFilesToAdr"
                               :id="`outputFile-${index}`">

                        <label class="form-check-label"
                               :for="`outputFile-${index}`"
                               v-translate="output.displayName"></label>

                        <small v-if="output.resourceId" class="text-danger row">
                        <span class="col-auto">
                        <span v-translate="'outputFileOverwrite'"></span>{{ output.lastModified }}
                        </span>
                        </small>
                    </div>
                </div>
                <div class="mt-3">
                    <label for="description-id" v-translate="'outputFileDesc'"></label>
                    <textarea v-model="pushDescToAdr"
                              class="form-control" rows="3"
                              id="description-id"></textarea>
                </div>
            </div>
            <template v-slot:footer>
                <button
                    type="button"
                    class="btn btn-red"
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
    import {UploadFileDict} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {mapActionByName, mapStateProps} from "../../utils";
    import {ADRState} from "../../store/adr/adr";

    interface Methods {
        handleCancel: () => void
        getUploadFiles: () => void
    }

    interface Computed {
        dataset: string
        outputFileMetadata: UploadFileDict
    }

    interface Data {
        pushFilesToAdr: string[]
        pushDescToAdr: string
    }

    interface Props {
        open: boolean
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "UploadModal",
        props: {
            open: {
                type: Boolean
            }
        },
        data(): Data {
            return {
                pushFilesToAdr: [],
                pushDescToAdr: ""
            }
        },
        mounted() {
            this.getUploadFiles();
        },
        methods: {
            handleCancel() {
                this.$emit("close")
            },
            getUploadFiles: mapActionByName("adr", "getUploadFiles")
        },
        computed: {
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                dataset: state => state.selectedDataset?.title
            }),
            ...mapStateProps<ADRState, keyof Computed>("adr", {
                outputFileMetadata: state => state.uploadFiles
            })
        },
        components: {
            Modal
        },
        watch: {
            outputFileMetadata(val) {
                this.pushFilesToAdr = Object.keys(val);
            }
        }
    });
</script>

