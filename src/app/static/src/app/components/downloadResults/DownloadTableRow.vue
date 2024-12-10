<template>
    <div class="row d-flex align-items-center">
        <span class="d-flex align-items-center col-md pl-0">
            <div class="py-2 file-type-container">
                <vue-feather :type="fileTypeUIConfigs[type].icon" size="25" class="baseline-aligned-icon"></vue-feather>
                <p class="mb-0 file-type-text" :style="{ color: fileTypeUIConfigs[props.type].color }">{{ fileTypeUIConfigs[type].text.toUpperCase() }}</p>
            </div>
            <h4 v-translate="getDownloadTranslationKey(type)" class="mb-0"></h4>
        </span>
        <span class="d-flex align-items-center col-md-3" :class="!downloadState.statusResponse?.done && 'dot-dot-dot'">
            <vue-feather :type="statusUIConfigs[downloadStatus].icon"
                         :stroke="statusUIConfigs[downloadStatus].color"
                         size="20"
                         class="icon mr-2"></vue-feather>
            <h6 class="mb-0">{{ downloadStatus[0].toUpperCase() + downloadStatus.substring(1).toLowerCase() }}</h6>
        </span>
        <button class="btn btn-lg col-md-auto mr-0"
                :class="disabled ? 'btn-secondary' : 'btn-red'"
                :disabled="disabled"
                @click="download">
            <span v-translate="'download'"></span>
            <vue-feather type="download" size="20" class="icon ml-2 baseline-aligned-icon"></vue-feather>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import VueFeather from "vue-feather";
import { DownloadType, fileTypeUIConfigs, getDownloadTranslationKey, statusUIConfigs, TaskStatus } from "../../store/downloadResults/downloadConfig";
import { useStore } from "vuex";
import { RootState } from "../../root";

const props = defineProps({
    type: { type: String as PropType<DownloadType>, required: true }
});

const store = useStore<RootState>();

const downloadState = computed(() => store.state.downloadResults[props.type]);
const disabled = computed(() => {
    return !downloadState.value.downloadId || downloadState.value.preparing || !!downloadState.value.metadataError;
});

const downloadStatus = computed(() => {
    // this branch might be a queued icon in the future so keeping it
    // separate from the actual statusResponse.status being PENDING
    if (!downloadState.value.statusResponse) return TaskStatus.PENDING;
    switch (downloadState.value.statusResponse.status) {
        case TaskStatus.PENDING:
            return TaskStatus.PENDING;
        case TaskStatus.RUNNING:
            return TaskStatus.RUNNING;
        case TaskStatus.COMPLETE:
            return TaskStatus.COMPLETE;
        case TaskStatus.ERROR:
            return TaskStatus.ERROR;
        default:
            return TaskStatus.UNKNOWN
    }
});

const download = () => {
    const fileUrl = `/download/result/${downloadState.value.downloadId}`
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "downloaded_file";
    link.click();
    link.remove();
}
</script>

<style lang="css" scoped>
@keyframes dot-dot-dot-animation {
    0% { content: ""; }
    25% { content: "."; }
    50% { content: ".."; }
    75% { content: "..."; }
}

.dot-dot-dot::after {
    display: inline-block;
    content: "";
    animation: dot-dot-dot-animation steps(1, end) 2s infinite;
}

.file-type-container {
    line-height: normal;
    text-align: center;
    margin-right: 10px;
    width: 3rem;
}

.file-type-text {
    font-size: small;
    font-weight: 900;
}

.baseline-aligned-icon {
    margin-bottom: -4px;
}
</style>
