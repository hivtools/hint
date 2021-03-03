<template>
    <div class="d-flex">
        <div v-if="selectedDataset" style="margin-top: 8px">
            <span class="font-weight-bold" v-translate="'selectedDataset'"></span>
            <a :href="selectedDataset.url" target="_blank">
              {{selectedDataset.title}}
                    </a>
            <span class="color-red">
        <info-icon
            size="20"
            v-if="outOfDateMessage"
            v-tooltip="outOfDateMessage"
            style="vertical-align: text-bottom"
        ></info-icon>
      </span>
        </div>
        <button
            v-if="outOfDateMessage"
            class="btn btn-white ml-2"
            @click="refresh"
            v-translate="'refresh'"
        ></button>
        <button
            class="btn btn-red"
            :class="selectedDataset && 'ml-2'"
            @click="toggleModal"
        >
            {{ selectText }}
        </button>
        <modal id="dataset" :open="open">
            <h4 v-if="!loading" v-translate="'browseADR'"></h4>
            <p v-if="loading" v-translate="'importingFiles'"></p>
            <div v-if="!loading">
                <tree-select
                    :multiple="false"
                    :searchable="true"
                    :options="datasetOptions"
                    :placeholder="select"
                    :disabled="fetchingDatasets"
                    v-model="newDatasetId"
                >
                    <label
                        slot="option-label"
                        slot-scope="{ node }"
                        v-html="node.raw.customLabel"
                    >
                    </label>
                </tree-select>
                <div :class="fetchingDatasets ? 'visible' : 'invisible'" style="margin-top:15px;" id="fetching-datasets">
                    <loading-spinner size="xs"></loading-spinner>
                    <span v-translate="'loadingDatasets'"></span>
                </div>
            </div>
            <div class="text-center" v-if="loading" id="loading-dataset">
                <loading-spinner size="sm"></loading-spinner>
            </div>
            <template v-slot:footer v-if="!loading">
                <button
                    type="button"
                    :disabled="!newDatasetId"
                    class="btn btn-red"
                    v-translate="'import'"
                    @click="importDataset"
                ></button>
                <button
                    type="button"
                    class="btn btn-white"
                    v-translate="'cancel'"
                    @click="toggleModal"
                ></button>
            </template>
        </modal>
    </div>
</template>
<script lang="ts">
    import i18next from "i18next";
    import {Language} from "../../store/translations/locales";
    import Vue from "vue";
    import TreeSelect from "@riophae/vue-treeselect";
    import {findResource, mapActionByName, mapMutationByName, mapStateProp} from "../../utils";
    import {RootState} from "../../root";
    import Modal from "../Modal.vue";
    import {BaselineMutation} from "../../store/baseline/mutations";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {BaselineState} from "../../store/baseline/baseline";
    import {
        ADRSchemas,
        Dataset,
        DatasetResource,
        DatasetResourceSet,
    } from "../../types";
    import {InfoIcon} from "vue-feather-icons";
    import {VTooltip} from "v-tooltip";
    import {ADRState} from "../../store/adr/adr";

    interface Methods {
        setDataset: (dataset: Dataset) => void;
        importDataset: () => void;
        toggleModal: () => void;
        importPJNZ: (url: string) => Promise<void>;
        importShape: (url: string) => Promise<void>;
        importPopulation: (url: string) => Promise<void>;
        importSurvey: (url: string) => Promise<void>;
        importProgram: (url: string) => Promise<void>;
        importANC: (url: string) => Promise<void>;
        refresh: () => void;
        refreshDatasetMetadata: () => void;
        markResourcesUpdated: () => void;
        startPolling: () => void;
        stopPolling: () => void;
    }

    interface Computed {
        schemas: ADRSchemas
        datasets: any[]
        fetchingDatasets: boolean
        datasetOptions: any[]
        selectedDataset: Dataset | null
        newDataset: Dataset
        selectText: string,
        outOfDateMessage: string,
        outOfDateResources: { [k in keyof DatasetResourceSet]?: true }
        hasShapeFile: boolean,
        currentLanguage: Language,
        select: string
    }

    interface Data {
        open: boolean;
        loading: boolean;
        newDatasetId: string | null;
        pollingId: number | null;
    }

    const names: { [k in keyof DatasetResourceSet]: string } = {
        pjnz: "PJNZ",
        pop: "Population",
        shape: "Shape file",
        survey: "Household Survey",
        program: "ART",
        anc: "ANC",
    };

    const namespace = "adr";

    export default Vue.extend<Data, Methods, Computed, unknown>({
        data() {
            return {
                open: false,
                loading: false,
                newDatasetId: null,
                pollingId: null,
            };
        },
        components: {Modal, TreeSelect, LoadingSpinner, InfoIcon},
        directives: {tooltip: VTooltip},
        computed: {
            hasShapeFile: mapStateProp<BaselineState, boolean>(
                "baseline",
                (state: BaselineState) => !!state.shape
            ),
            schemas: mapStateProp<ADRState, ADRSchemas>(
                namespace,
                (state: ADRState) => state.schemas!
            ),
            selectedDataset: mapStateProp<BaselineState, Dataset | null>(
                "baseline",
                (state: BaselineState) => state.selectedDataset
            ),
            datasets: mapStateProp<ADRState, any[]>(
                namespace,
                (state: ADRState) => state.datasets
            ),
            fetchingDatasets: mapStateProp<ADRState, boolean>(
                namespace,
                (state: ADRState) => state.fetchingDatasets
            ),
            datasetOptions() {
                return this.datasets.map((d) => ({
                    id: d.id,
                    label: d.title,
                    customLabel: `${d.title}
                        <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                            (${d.name})<br/>
                            <span class="font-weight-bold">${d.organization.title}</span>
                        </div>`,
                }));
            },
            newDataset() {
                const fullMetaData = this.datasets.find(d => d.id == this.newDatasetId);
                return fullMetaData && {
                    id: fullMetaData.id,
                    title: fullMetaData.title,
                    url: `${this.schemas.baseUrl}${fullMetaData.type}/${fullMetaData.name}`,
                    resources: {
                        pjnz: findResource(fullMetaData, this.schemas.pjnz),
                        shape: findResource(fullMetaData, this.schemas.shape),
                        pop: findResource(fullMetaData, this.schemas.population),
                        survey: findResource(fullMetaData, this.schemas.survey),
                        program: findResource(fullMetaData, this.schemas.programme),
                        anc: findResource(fullMetaData, this.schemas.anc)
                    }
                }
            },
            selectText() {
                if (this.selectedDataset) {
                    return i18next.t('editBtn', {lng: this.currentLanguage})
                } else {
                    return i18next.t('selectADR', {lng: this.currentLanguage})
                }
            },
            outOfDateResources() {
                if (!this.selectedDataset) {
                    return {};
                }
                const resources = this.selectedDataset.resources;
                const outOfDateResources: { [k in keyof DatasetResourceSet]?: true } = {};
                Object.keys(resources).map((k) => {
                    const key = k as keyof DatasetResourceSet;
                    if (resources[key] && resources[key]!.outOfDate) {
                        outOfDateResources[key] = true;
                    }
                });
                return outOfDateResources
            },
            outOfDateMessage() {
                const updatedNames = Object.keys(this.outOfDateResources)
                    .map(r => names[r as keyof DatasetResourceSet]).join(", ")
                if (Object.keys(this.outOfDateResources).length == 0) {
                    return ""
                }
                return `The following files have been updated in the ADR: ${updatedNames}. Use the refresh button to import the latest files.`
            },
            select() {
                return i18next.t('select', {lng: this.currentLanguage})
            },
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language)
        },
        methods: {
            setDataset: mapMutationByName("baseline", BaselineMutation.SetDataset),
            refreshDatasetMetadata: mapActionByName("baseline", "refreshDatasetMetadata"),
            markResourcesUpdated: mapMutationByName("baseline", BaselineMutation.MarkDatasetResourcesUpdated),
            importPJNZ: mapActionByName("baseline", "importPJNZ"),
            importShape: mapActionByName("baseline", "importShape"),
            importPopulation: mapActionByName("baseline", "importPopulation"),
            importSurvey: mapActionByName("surveyAndProgram", "importSurvey"),
            importProgram: mapActionByName("surveyAndProgram", "importProgram"),
            importANC: mapActionByName("surveyAndProgram", "importANC"),
            async importDataset() {
                if (this.newDatasetId) {
                    this.loading = true;
                    this.setDataset(this.newDataset);

                    const {pjnz, pop, shape, survey, program, anc} = this.newDataset.resources

                    await Promise.all([
                        pjnz && this.importPJNZ(pjnz.url),
                        pop && this.importPopulation(pop.url),
                        shape && this.importShape(shape.url)]);

                    (shape || this.hasShapeFile) && await Promise.all([
                        survey && this.importSurvey(survey.url),
                        program && this.importProgram(program.url),
                        anc && this.importANC(anc.url)
                    ]);

                    this.loading = false;
                    this.open = false;
                }
            },
            async refresh() {
                this.stopPolling();

                this.loading = true;
                this.open = true;
                const {pjnz, pop, shape, survey, program, anc} = this.selectedDataset!.resources;
                await Promise.all([
                    this.outOfDateResources["pjnz"] && pjnz && this.importPJNZ(pjnz.url),
                    this.outOfDateResources["pop"] && pop && this.importPopulation(pop.url),
                    this.outOfDateResources["shape"] &&
                    shape &&
                    this.importShape(shape.url),
                ]);

                const baselineUpdated =
                    this.outOfDateResources["pjnz"] ||
                    this.outOfDateResources["pop"] ||
                    this.outOfDateResources["shape"];

                // if baseline files are updated, we have to re-import all survey & program files,
                // regardless of whether they have changed, since updating the baseline files will
                // have wiped these
                (shape || this.hasShapeFile) &&
                (await Promise.all([
                    (baselineUpdated || this.outOfDateResources["survey"]) &&
                    survey &&
                    this.importSurvey(survey.url),
                    (baselineUpdated || this.outOfDateResources["program"]) &&
                    program &&
                    this.importProgram(program.url),
                    (baselineUpdated || this.outOfDateResources["anc"]) &&
                    anc &&
                    this.importANC(anc.url),
                ]));

                this.markResourcesUpdated();
                this.loading = false;
                this.open = false;

                this.startPolling();
            },
            toggleModal() {
                this.open = !this.open;
            },
            startPolling() {
                this.pollingId = window.setInterval(this.refreshDatasetMetadata, 10000);
            },
            stopPolling() {
                if (this.pollingId) {
                    window.clearInterval(this.pollingId);
                }
            }
        },
        mounted() {
            this.refreshDatasetMetadata();
            this.startPolling();
        },
        beforeDestroy() {
            this.stopPolling();
        }
    })
</script>
