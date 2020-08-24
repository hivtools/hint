<template>
    <div class="d-flex">
        <div v-if="selectedDataset" style="margin-top:8px">
            <span class="font-weight-bold">Selected dataset:</span>
            <a :href="selectedDataset.url">{{selectedDataset.title}}</a>
        </div>
        <button class="btn btn-red" :class="selectedDataset && 'ml-2'" @click="toggleModal">{{selectText}}</button>
        <modal id="dataset" :open="open">
            <h4>Browse ADR</h4>
            <div v-if="!loading">
                <tree-select :multiple="false"
                             :searchable="true"
                             :options="datasetOptions"
                             v-model="newDatasetId">
                    <label slot="option-label"
                           slot-scope="{ node }"
                           v-html="node.raw.customLabel">
                    </label>
                </tree-select>
            </div>
            <div class="text-center" v-if="loading">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-white"
                        @click="importDataset"
                        :disabled="loading">
                    Import
                </button>
                <button type="button"
                        class="btn btn-white"
                        @click="toggleModal"
                        :disabled="loading">
                    Cancel
                </button>
            </template>
        </modal>
    </div>
</template>
<script lang="ts">
    import Vue from "vue"
    import TreeSelect from '@riophae/vue-treeselect'
    import {mapMutationByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import Modal from "../Modal.vue";
    import {BaselineMutation} from "../../store/baseline/mutations";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {BaselineState} from "../../store/baseline/baseline";
    import {Dataset} from "../../types";

    interface Methods {
        setDataset: (dataset: Dataset) => void
        importDataset: () => void
        toggleModal: () => void
    }

    interface Computed {
        datasets: any[]
        datasetOptions: any[]
        selectedDataset: Dataset | null
        newDataset: Dataset
        selectText: string
    }

    interface Data {
        open: boolean
        loading: boolean
        newDatasetId: string | null
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        data() {
            return {
                open: false,
                loading: false,
                newDatasetId: null
            }
        },
        components: {Modal, TreeSelect, LoadingSpinner},
        computed: {
            selectedDataset: mapStateProp<BaselineState, Dataset | null>("baseline",
                (state: BaselineState) => state.selectedDataset),
            datasets: mapStateProp<RootState, any[]>(null,
                (state: RootState) => state.adrDatasets),
            datasetOptions() {
                return this.datasets.map(d => ({
                    id: d.id,
                    label: d.title,
                    customLabel: `${d.title}
                        <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                            (${d.name})<br/>
                            <span class="font-weight-bold">${d.organization.title}</span>
                        </div>`
                }))
            },
            newDataset() {
                const fullMetaData = this.datasets.find(d => d.id = this.newDatasetId)
                return fullMetaData && {
                    id: fullMetaData.id,
                    title: fullMetaData.title,
                    revision_id: fullMetaData.revision_id,
                    url: `https://adr.unaids.org/${fullMetaData.type}/${fullMetaData.name}`
                }
            },
            selectText() {
                if (this.selectedDataset){
                    return "Edit"
                }
                else {
                    return "Select ADR dataset"
                }
            }
        },
        methods: {
            setDataset: mapMutationByName("baseline", BaselineMutation.SetDataset),
            importDataset() {
                this.loading = true;
                this.setDataset(this.newDataset);
                // TODO import each file
                // TODO await all
                setTimeout(() => {
                    // mock importing of files with a timeout
                    this.loading = false;
                    this.open = false;
                }, 200)
            },
            toggleModal() {
                this.open = !this.open;
            }
        }
    })
</script>