<template>
    <div class="d-flex">
        <div v-if="selectedDataset" class="mt-2">
            <span class="fw-bold me-1"
                  v-translate="'selectedDataset'"
                  id="selectedDatasetSpan">
            </span>
            <a v-if="releaseName" :href="releaseURL" target="_blank">
                {{ selectedDataset.title }} — {{ releaseName }}
            </a>
            <a v-else :href="selectedDataset.url" target="_blank">
                {{ selectedDataset.title }}
            </a>
            <span class="color-red">
                <vue-feather type="info"
                           size="20"
                           v-if="outOfDateMessage"
                           v-tooltip="outOfDateMessage"
                           class="align-text-bottom">
                </vue-feather>
            </span>
        </div>
        <button v-if="outOfDateMessage"
                class="btn btn-white ms-2"
                @click="refresh"
                v-translate="'refresh'">
        </button>
        <button class="btn btn-red"
                :class="selectedDataset && 'ms-2'"
                @click="toggleModal">
            {{ selectText }}
        </button>
        <select-dataset-modal
            :open="open"
            :loading="loading"
            :dataset-type="AdrDatasetType.Input"
            @confirm-import="confirmImport"
            @close-modal="toggleModal">
        </select-dataset-modal>
        <reset-confirmation
            v-if="showConfirmation"
            :discard-step-warning="selectedDatasetIsRefreshed ? modelOptions : null"
            :continue-editing="continueEditing"
            :cancel-editing="cancelEditing"
            :open="showConfirmation">
        </reset-confirmation>
    </div>
</template>
<script lang="ts">
import i18next from "i18next";
import {Language} from "../../store/translations/locales";
import {mapActionByName, mapGetterByName, mapMutationByName, mapStateProp,} from "../../utils";
import {RootState} from "../../root";
import {BaselineMutation} from "../../store/baseline/mutations";
import {BaselineState} from "../../store/baseline/baseline";
import {Dataset, DatasetResourceSet, Release, Step} from "../../types";
import VueFeather from "vue-feather";
import ResetConfirmation from "../resetConfirmation/ResetConfirmation.vue";
import SelectDatasetModal from "./SelectDatasetModal.vue";
import ResetConfirmationMixin from "../resetConfirmation/ResetConfirmationMixin";
import {defineComponent} from "vue";
import {AdrDatasetType} from "../../store/adr/adr";

interface Data {
        open: boolean;
        showConfirmation: boolean;
        loading: boolean;
        newDatasetId: string | null;
        newDatasetReleaseId: string | null;
        pollingId: number | null;
        modelOptions: number;
        AdrDatasetType: typeof AdrDatasetType;
    }

    const names: { [k in keyof DatasetResourceSet]: string } = {
        pjnz: "PJNZ",
        pop: "Population",
        shape: "Shape file",
        survey: "Household Survey",
        program: "ART",
        anc: "ANC",
        vmmc: "VMMC",
    };

    export default defineComponent({
        extends: ResetConfirmationMixin,
        data(): Data {
            return {
                open: false,
                showConfirmation: false,
                loading: false,
                newDatasetId: null,
                pollingId: null,
                newDatasetReleaseId: null,
                modelOptions: Step.ModelOptions,
                AdrDatasetType: AdrDatasetType,
            };
        },
        components: {
            VueFeather,
            ResetConfirmation,
            SelectDatasetModal,
        },
        computed: {
            hasShapeFile: mapStateProp<BaselineState, boolean>(
                "baseline",
                (state: BaselineState) => !!state.shape
            ),
            hasPopulationFile: mapStateProp<BaselineState, boolean>(
                "baseline",
                (state: BaselineState) => !!state.population
            ),
            hasPjnzFile: mapStateProp<BaselineState, boolean>(
                "baseline",
                (state: BaselineState) => !!state.pjnz
            ),
            selectedDataset: mapStateProp<BaselineState, Dataset | null>(
                "baseline",
                (state: BaselineState) => state.selectedDataset
            ),
            selectedDatasetIsRefreshed: mapStateProp<BaselineState, boolean>(
                "baseline",
                (state: BaselineState) => state.selectedDatasetHasChanged
            ),
            selectedRelease: mapStateProp<BaselineState, Release | null>(
                "baseline",
                (state: BaselineState) => state.selectedRelease
            ),
            selectedDatasetAvailableResources: mapGetterByName("baseline", "selectedDatasetAvailableResources"),
            releaseName() {
                return this.selectedRelease?.name || null;
            },
            releaseURL() {
                return new URL(this.selectedDataset!.url).origin + '/dataset/' + this.selectedDataset!.id + '?activity_id=' + this.selectedRelease!.activity_id;
            },
            selectText() {
                if (this.selectedDataset) {
                    return i18next.t("editBtn", {lng: this.currentLanguage});
                } else {
                    return i18next.t("selectADR", {lng: this.currentLanguage});
                }
            },
            outOfDateResources() {
                if (!this.selectedDataset) {
                    return {};
                }
                const resources = this.selectedDataset.resources;
                const outOfDateResources: {
                    [k in keyof DatasetResourceSet]?: true;
                } = {};
                Object.keys(resources).map((k) => {
                    const key = k as keyof DatasetResourceSet;
                    if (resources[key] && resources[key]!.outOfDate) {
                        outOfDateResources[key] = true;
                    }
                });
                return outOfDateResources;
            },
            outOfDateMessage() {
                const updatedNames = Object.keys(this.outOfDateResources)
                    .map((r) => names[r as keyof DatasetResourceSet])
                    .join(", ");
                if (Object.keys(this.outOfDateResources).length == 0) {
                    return "";
                }
                return `The following files have been updated in the ADR: ${updatedNames}. Use the refresh button to import the latest files.`;
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            )
        },
        methods: {
            getDatasets: mapActionByName("adr", "getDatasets"),
            getDataset: mapActionByName("adr", "getDataset"),
            refreshDatasetMetadata: mapActionByName(
                "baseline",
                "refreshDatasetMetadata"
            ),
            markResourcesUpdated: mapMutationByName(
                "baseline",
                BaselineMutation.MarkDatasetResourcesUpdated
            ),
            importPJNZ: mapActionByName("baseline", "importPJNZ"),
            importShape: mapActionByName("baseline", "importShape"),
            importPopulation: mapActionByName("baseline", "importPopulation"),
            deleteBaselineFiles: mapActionByName("baseline", "deleteAll"),
            importSurvey: mapActionByName("surveyAndProgram", "importSurvey"),
            importProgram: mapActionByName("surveyAndProgram", "importProgram"),
            importANC: mapActionByName("surveyAndProgram", "importANC"),
            importVmmc: mapActionByName("surveyAndProgram", "importVmmc"),
            async importDataset() {
                this.stopPolling();

                this.loading = true;

                if (this.hasShapeFile || this.hasPopulationFile || this.hasPjnzFile) {
                    await this.deleteBaselineFiles()
                }

                await this.getDataset({
                    id: this.newDatasetId!,
                    release: this.newDatasetReleaseId,
                    datasetType: AdrDatasetType.Input
                });
                const {
                    pjnz,
                    pop,
                    shape,
                    survey,
                    program,
                    anc,
                    vmmc,
                } = this.selectedDatasetAvailableResources;

                await Promise.all([
                    pjnz && this.importPJNZ(pjnz.url),
                    pop && this.importPopulation(pop.url),
                    shape && this.importShape(shape.url),
                ]);

                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                (shape || this.hasShapeFile) &&
                (await Promise.all([
                    survey && this.importSurvey(survey.url),
                    program && this.importProgram(program.url),
                    anc && this.importANC(anc.url),
                    vmmc && this.importVmmc(vmmc.url),
                ]));

                this.loading = false;
                this.open = false;

                this.startPolling();
            },
            async refresh() {
                this.stopPolling();

                this.loading = true;
                this.open = true;
                const {
                    pjnz,
                    pop,
                    shape,
                    survey,
                    program,
                    anc,
                    vmmc,
                } = this.selectedDataset!.resources;
                await Promise.all([
                    this.outOfDateResources["pjnz"] &&
                    pjnz &&
                    this.importPJNZ(pjnz.url),
                    this.outOfDateResources["pop"] &&
                    pop &&
                    this.importPopulation(pop.url),
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
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
                    (baselineUpdated || this.outOfDateResources["vmmc"]) &&
                    vmmc &&
                    this.importVmmc(vmmc.url),
                ]));

                this.markResourcesUpdated();
                this.loading = false;
                this.open = false;

                this.startPolling();
            },
            toggleModal() {
                this.open = !this.open;
            },
            confirmImport(datasetId: string, releaseId: string | null) {
                this.newDatasetId = datasetId;
                this.newDatasetReleaseId = releaseId;
                if (this.editsRequireConfirmation) {
                    this.open = false
                    this.showConfirmation = true;
                } else {
                    this.importDataset();
                }
            },
            continueEditing() {
                this.showConfirmation = false;
                this.importDataset();
            },
            cancelEditing() {
                this.showConfirmation = false;
                this.open = false;
            },
            startPolling() {
                if (!this.selectedDataset?.release) {
                    this.pollingId = window.setInterval(
                        this.refreshDatasetMetadata,
                        10000
                    );
                }
            },
            stopPolling() {
                if (this.pollingId) {
                    window.clearInterval(this.pollingId);
                }
            }
        },
        mounted() {
            this.getDatasets(AdrDatasetType.Input);
            this.refreshDatasetMetadata();
            this.startPolling();
        },
        beforeUnmount() {
            this.stopPolling();
        },
    });
</script>
