<template>
    <select-dataset
        :open="openModal"
        :loading="loading"
        :dataset-type="AdrDatasetType.Output"
        @confirm-import="importOutputZip"
        @close-modal="$emit('cancel-create')">
    </select-dataset>
</template>

<script setup lang="ts">
import SelectDataset from "./SelectDatasetModal.vue";
import {onMounted, ref} from "vue";
import {AdrDatasetType} from "../../store/adr/adr";
import {useStore} from "vuex";
import {RootState} from "../../root";

defineProps({
    openModal: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits<{
    (e: "submitCreate"): void
    (e: "cancelCreate"): void
}>();

const loading = ref<boolean>(false);
const store = useStore<RootState>();

const importOutputZip = async (datasetId: string, releaseId: string | null) => {
    loading.value = true;
    await store.dispatch("adr/getDataset", {id: datasetId, release: releaseId, datasetType: AdrDatasetType.Output});
    loading.value = false;

    const fetchingError = store.state.adr.adrData[AdrDatasetType.Output].fetchingError;
    const outputZip = store.state.projects.adrRehydrateOutputZip;
    if (!fetchingError && outputZip) {
        emit('submit-create');
    }
};

onMounted(() => {
    store.dispatch("adr/getDatasets", AdrDatasetType.Output)
});
</script>
