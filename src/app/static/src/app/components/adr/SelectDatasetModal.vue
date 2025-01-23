<template>
    <modal id="dataset" :open="open">
        <template v-if="loading">
            <p v-translate="'importingFiles'"></p>
            <div class="text-center" id="loading-dataset">
                <loading-spinner size="sm"></loading-spinner>
            </div>
        </template>
        <template v-else>
            <h4 v-translate="'browseADR'"></h4>
            <div>
                <label id="select-dataset-label" class="font-weight-bold" v-translate="datasetLabelKey"></label>
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
                <select-release :dataset-id="datasetId"
                                :open="open"
                                :dataset-type="datasetType"
                                :selector-label-key="releaseLabelKey"
                                @selected-dataset-release="(newReleaseId) => datasetReleaseId = newReleaseId"
                                @valid="(newValue) => valid = newValue">
                </select-release>
                <div :class="fetchingDatasets ? 'visible' : 'invisible'"
                     style="margin-top: 15px"
                     id="fetching-datasets">
                    <loading-spinner size="xs"></loading-spinner>
                    <span v-translate="'loadingDatasets'"></span>
                </div>
                <div v-if="fetchingError" id="fetch-error">
                    <div v-if="fetchingError.detail">{{ fetchingError.detail }}</div>
                    <button @click="fetchDatasets"
                            class="btn btn-red float-right"
                            v-translate="'tryAgain'">
                    </button>
                </div>
            </div>
        </template>
        <template v-slot:footer v-if="!loading">
            <button id="importBtn"
                    type="button"
                    :disabled="disableImport"
                    class="btn btn-red"
                    v-translate="'import'"
                    @click="$emit('confirmImport', datasetId!!, datasetReleaseId)">
            </button>
            <button id="importCancelBtn"
                    type="button"
                    class="btn btn-white"
                    v-translate="'cancel'"
                    @click="$emit('closeModal')">
            </button>
        </template>
    </modal>
</template>

<script setup lang="ts">
import HintTreeSelect from "../HintTreeSelect.vue";
import LoadingSpinner from "../LoadingSpinner.vue";
import SelectRelease from "./SelectRelease.vue";
import Modal from "../Modal.vue";
import {useStore} from "vuex";
import {RootState} from "../../root";
import i18next from "i18next";
import {computed, PropType, ref, watch, watchEffect} from "vue";
import {AdrDatasetType} from "../../store/adr/adr";

defineEmits<{
    (e: "confirmImport", datasetId: string, release: string | null): void
    (e: "closeModal"): void
}>();

const props = defineProps({
    open: {
        type: Boolean,
        required: true
    },
    loading: {
        type: Boolean,
        required: true
    },
    datasetType: {
        type: String as PropType<AdrDatasetType>,
        required: true
    },
});

const store = useStore<RootState>();

const datasetId = ref<string | null>(null);
const datasetReleaseId = ref<string | null>(null);
const valid = ref<boolean>(true);

let datasetLabelKey = "datasets";
let releaseLabelKey = "releases";
if (props.datasetType === AdrDatasetType.Output) {
    datasetLabelKey = "datasetsWithOutputZip";
    releaseLabelKey = "releasesWithOutputZip";
}

const selectedDatasetId = computed(() => {
    if (props.datasetType === AdrDatasetType.Input) {
        return store.state.baseline.selectedDataset?.id
    } else {
        return null
    }
});
const select = computed(() => i18next.t("select", store.state.language));
const fetchingDatasets = computed(() => store.state.adr.adrData[props.datasetType].fetchingDatasets);
const fetchingError = computed(() => store.state.adr.adrData[props.datasetType].fetchingError);
const datasets = computed(() => store.state.adr.adrData[props.datasetType].datasets);
const disableImport = computed(() => !datasetId.value || !valid.value);

const datasetOptions = computed(() => {
    return datasets.value.map((d: any) => ({
        id: d.id,
        label: d.title,
        customLabel: `${d.title}
                            <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                                (${d.name})<br/>
                                <span class="font-weight-bold">${d.organization.title}</span>
                            </div>`,
    }));
});

const fetchDatasets = () => store.dispatch("adr/getDatasets", props.datasetType);
const preSelectDataset = () => {
    if (selectedDatasetId.value && datasets.value.some((dataset: any) => dataset.id === selectedDatasetId.value)) {
        datasetId.value = selectedDatasetId.value
    }
};
watchEffect(() => {
    if (props.open) {
        preSelectDataset()
    }
});
watch(datasets, preSelectDataset);
</script>

<style scoped>
:deep(.modal-body) {
    overflow: visible
}
</style>