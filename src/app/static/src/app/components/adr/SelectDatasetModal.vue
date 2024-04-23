<template>
    <modal id="dataset" :open="open">
        <h4 v-if="!fetchingDataset" v-translate="'browseADR'"></h4>
        <p v-if="fetchingDataset" v-translate="'importingFiles'"></p>
        <div v-if="!fetchingDataset">
            <label class="font-weight-bold" v-translate="'datasets'"></label>
            <hint-tree-select id="datasetSelector"
                              :multiple="false"
                              :searchable="true"
                              :options="datasetOptions"
                              :placeholder="select"
                              :disabled="fetchingDatasets"
                              v-model="datasetId">
                <template v-slot:option-label="{node}">
                    <label v-html="node.raw.customLabel">
                    </label>
                </template>
            </hint-tree-select>
            <select-release :dataset-id="datasetId ? datasetId : null"
                            :open="open"
                            @selected-dataset-release="(newRelease) => datasetRelease = newRelease"
                            @valid="(newValue) => valid = newValue">
            </select-release>
            <div :class="fetchingDatasets ? 'visible' : 'invisible'"
                 style="margin-top: 15px"
                 id="fetching-datasets">
                <loading-spinner size="xs"></loading-spinner>
                <span v-translate="'loadingDatasets'"></span>
            </div>
            <div v-if="adrError" id="fetch-error">
                <div v-if="adrError.detail">{{adrError.detail}}</div>
                <button @click="$emit('fetchDatasets')"
                        class="btn btn-red float-right"
                        v-translate="'tryAgain'">
                </button>
            </div>
        </div>
        <div class="text-center" v-if="fetchingDataset" id="loading-dataset">
            <loading-spinner size="sm"></loading-spinner>
        </div>
        <template v-slot:footer v-if="!fetchingDataset">
            <button id="importBtn"
                    type="button"
                    :disabled="disableImport"
                    class="btn btn-red"
                    v-translate="'import'"
                    @click="$emit('confirmImport', datasetId, datasetRelease)">
            </button>
            <button type="button"
                    class="btn btn-white"
                    v-translate="'cancel'"
                    @click="$emit('closeModal')">
            </button>
        </template>
    </modal>
</template>

<script setup lang="ts">
import SelectRelease from "./SelectRelease.vue";
import LoadingSpinner from "../LoadingSpinner.vue";
import Modal from "../Modal.vue";
import HintTreeSelect from "../HintTreeSelect.vue";
import {ref, computed} from "vue";
import {Release} from "../../types";
import i18next from "i18next";
import {useStore} from "vuex";

defineEmits<{
    (e: "confirmImport", datasetId: string, release: Release): void
    (e: "fetchDatasets"): void
    (e: "closeModal"): void
}>();

const props = defineProps({
    open: { type: Boolean, required: true },
    fetchingDataset: { type: Boolean, required: true },
    datasets: { type: Array, required: true },
    selectedDatasetId: { type: String, required: false},
});

const store = useStore();
const datasetId = ref<string | null>(props.selectedDatasetId);
const valid = ref<boolean>(true);
const datasetRelease = ref<Release | null>(null);

const fetchingDatasets = computed(() => store.state.fetchingDatasets);
const datasetOptions = computed(() => {
    if (props.datasets) {
        return props.datasets?.map((d: any) => ({
            id: d.id,
            label: d.title,
            customLabel: `${d.title}
            <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                (${d.name})<br/>
                <span class="font-weight-bold">${d.organization.title}</span>
            </div>`,
        }));
    } else {
        return [];
    }
});

// const preSelectDataset = computed(() {
//     const selectedDatasetId = this.selectedDataset?.id
//     if (selectedDatasetId && this.datasets.some((dataset: any) => dataset.id === selectedDatasetId)) {
//         this.newDatasetId = selectedDatasetId;
//     }
// };

const disableImport = computed(() => !datasetId.value || !valid.value);

const select = computed(() => i18next.t("select", {lng: currentLanguage.value}));

const currentLanguage = computed(() => store.state.language);

const adrError = computed(() => store.state.adr.adrError);

</script>
