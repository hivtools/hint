<template>
    <modal id="dataset" :open="open">
        <h4 v-if="!loading" v-translate="'browseADR'"></h4>
        <p v-if="loading" v-translate="'importingFiles'"></p>
        <div v-if="!loading">
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
                            :dataset-type="datasetType"
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
                <div v-if="fetchingError.detail">{{fetchingError.detail}}</div>
                <button @click="fetchDatasets"
                        class="btn btn-red float-right"
                        v-translate="'tryAgain'">
                </button>
            </div>
        </div>
        <div class="text-center" v-if="loading" id="loading-dataset">
            <loading-spinner size="sm"></loading-spinner>
        </div>
        <template v-slot:footer v-if="!loading && datasetId">
            <button id="importBtn"
                    type="button"
                    :disabled="disableImport"
                    class="btn btn-red"
                    v-translate="'import'"
                    @click="$emit('confirmImport', datasetId, datasetReleaseId)">
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
import HintTreeSelect from "../HintTreeSelect.vue";
import LoadingSpinner from "../LoadingSpinner.vue";
import SelectRelease from "./SelectRelease.vue";
import Modal from "../Modal.vue";
import {useStore} from "vuex";
import {RootState} from "../../root";
import i18next from "i18next";
import {computed, PropType, ref, watch, watchEffect} from "vue";
import {AdrDatasetType} from "../../store/adr/adr";

// eslint-disable-next-line no-undef
defineEmits<{
    (e: "confirmImport", datasetId: string, release: string | null): void
    (e: "closeModal"): void
}>();

// eslint-disable-next-line no-undef
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
})

const store = useStore<RootState>();

const datasetId = ref<string | null>(null);
const datasetReleaseId = ref<string | null>(null);
const valid = ref<boolean>(true);

const selectedDatasetId = computed(() => store.state.baseline.selectedDataset?.id);
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
