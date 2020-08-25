<template>
    <div class="d-flex">
        <div v-if="selectedDataset" style="margin-top:8px">
            <span class="font-weight-bold">Selected dataset:</span>
            <a :href="selectedDataset.url" target="_blank">{{selectedDataset.title}}</a>
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
    import {mapActionByName, mapMutationByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import Modal from "../Modal.vue";
    import {BaselineMutation} from "../../store/baseline/mutations";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {BaselineState} from "../../store/baseline/baseline";
    import {ADRSchemas, Dataset} from "../../types";

    interface Methods {
        setDataset: (dataset: Dataset) => void
        importDataset: () => void
        toggleModal: () => void
        importPJNZ: (url: string) => Promise<void>
        importShape: (url: string) => Promise<void>
        importPopulation: (url: string) => Promise<void>
        importSurvey: (url: string) => Promise<void>
        importProgram: (url: string) => Promise<void>
        importANC: (url: string) => Promise<void>
    }

    interface Computed {
        schemas: ADRSchemas
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
            schemas: mapStateProp<RootState, ADRSchemas>(null,
                (state: RootState) => state.adrSchemas!!),
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
                    url: `${this.schemas.baseUrl}${fullMetaData.type}/${fullMetaData.name}`
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
            importPJNZ: mapActionByName("baseline", "importPJNZ"),
            importShape: mapActionByName("baseline", "importShape"),
            importPopulation: mapActionByName("baseline", "importPopulation"),
            importSurvey: mapActionByName("surveyAndProgram", "importSurvey"),
            importProgram: mapActionByName("surveyAndProgram", "importProgram"),
            importANC: mapActionByName("surveyAndProgram", "importANC"),
            async importDataset() {
                this.loading = true;
                this.setDataset(this.newDataset);
                const d = this.datasets.find(d => d.id = this.newDatasetId);
                const pjnz = d.resources.find((r: any) => r.resource_type == "inputs-unaids-spectrum-file");
                const shape = d.resources.find((r: any) => r.resource_type == "inputs-unaids-geographic");
                const pop = d.resources.find((r: any) => r.resource_type == "inputs-unaids-population");
                const survey = d.resources.find((r: any) => r.resource_type == "inputs-unaids-survey");
                const program = d.resources.find((r: any) => r.resource_type == "inputs-unaids-art");
                const anc = d.resources.find((r: any) => r.resource_type == "inputs-unaids-anc");

                await Promise.all([
                      pjnz && this.importPJNZ(pjnz.url),
                      pop && this.importPopulation(pop.url),
                      shape && await this.importShape(shape.url)]);

                shape && await Promise.all([
                      survey && this.importSurvey(survey.url),
                      program && this.importProgram(program.url),
                      anc && this.importANC(anc.url)
                ])

                this.loading = false;
                this.open = false;
            },
            toggleModal() {
                this.open = !this.open;
            }
        }
    })
</script>