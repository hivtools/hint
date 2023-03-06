<template>
    <div id="download">
        <h4 v-translate="translateKey.header"></h4>
        <button class="btn btn-lg my-3" :class="disabled ? 'btn-secondary' : 'btn-red'"
                :disabled="disabled"
                @click="download">
            <span v-translate="translateKey.button"></span>
            <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
        </button>
        <div>
            <download-status id="progress"
                             :translate-key="'preparing'"
                             :preparing="file.preparing"/>
        </div>
        <error-alert id="error" v-if="file.error" :error="file.error"></error-alert>
    </div>
</template>

<script lang="ts">
    import {defineComponent} from "vue";
    import type { PropType } from "vue";
    import DownloadStatus from "./DownloadStatus.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {DownloadIcon} from "vue-feather";
    import {DownloadResultsDependency} from "../../types";

    interface downloadTranslate {
        header: string,
        button: string
    }

    interface Props {
        file: DownloadResultsDependency,
        translateKey: downloadTranslate,
        disabled: boolean
    }

    interface Methods {
        download: () => void
    }

    export default defineComponent({
        name: "Download",
        components: {
            DownloadIcon,
            ErrorAlert,
            DownloadStatus
        },
        props: {
            file: {
                required: true,
                type: Object as PropType<DownloadResultsDependency>
            },
            translateKey: {
                required: true,
                type: Object as PropType<downloadTranslate>
            },
            disabled: {
                required: true,
                type: Boolean
            }
        },
        methods: {
            download() {
                this.$emit("click")
            }
        }
    })
</script>
