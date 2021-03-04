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
                               :value="output.displayName"
                               v-model="pushFilesToAdr"
                               :id="`outputFile-${index}`">

                        <label class="form-check-label"
                               :for="`outputFile-${index}`"
                               v-translate="getTranslatedLabel(output.displayName)"></label>

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
    import {ADRUploadMetadataDict} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {mapStateProps} from "../../utils";

    interface Methods {
        handleCancel: () => void
        getTranslatedLabel: (name: string) => string
    }

    interface Computed {
        dataset: string
    }

    const fakeMetadata = {
        outputZip:
            {
                displayName: "Model outputs",
                resourceType: "inputs-unaids-naomi-output-zip",
                resourceFilename: "naomi-model-outputs-project1.zip",
                resourceId: null,
                lastModified: null,
                resourceUrl: null
            },
        outputSummary:
            {
                displayName: "Summary",
                resourceType: "string",
                resourceFilename: "string",
                resourceId: "value",
                lastModified: "24/02/21 17:22",
                resourceUrl: null
            }
    }

    interface Data {
        pushFilesToAdr: []
        pushDescToAdr: string
        outputFileMetadata: ADRUploadMetadataDict
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
                pushDescToAdr: "",
                outputFileMetadata: fakeMetadata
            }
        },
        methods: {
            handleCancel() {
                this.$emit("close")
            },
            getTranslatedLabel(name: string) {
                console.log(this.pushFilesToAdr.length)
                return `outputFile${name.trim().replace(/\s/g, "")}`
            }
        },
        computed: {
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                dataset: state => state.selectedDataset?.title
            })
        },
        components: {
            Modal
        }
    });
</script>

