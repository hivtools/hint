<template>
    <div v-if="errors.length > 0" class="row download-error-alert mt-2 d-block">
        <template v-for="err in errors" :key="err">
            <p class="my-0">{{ err }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useStore } from 'vuex';
import { RootState } from '../../root';
import { DownloadType, getDownloadTranslationKey } from '../../store/downloadResults/downloadConfig';
import { computed } from 'vue';
import i18next from 'i18next';

const store = useStore<RootState>();

const errors = computed(() => {
    return Object.values(DownloadType).reduce((errs, type) => {
        const { downloadError, error, metadataError } = store.state.downloadResults[type];
        const err = metadataError || downloadError || error;
        if (!err) return errs;
        const errWhileGenerating = i18next.t("errorWhileGeneratingDownload", { lng: store.state.language });
        const fileTitle = i18next.t(getDownloadTranslationKey(type), { lng: store.state.language });
        const jobId = err.job_id ? ` ID ${err.job_id}, ` : "";
        const errMsg = `${errWhileGenerating} ${fileTitle} -${jobId} ${err.detail || err.error}`;
        return err ? [...errs, errMsg] : errs;
    }, [] as string[]);
});
</script>

<style>
.download-error-alert {
    background-color: #e5163810;
    color: darkred;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
}
</style>
