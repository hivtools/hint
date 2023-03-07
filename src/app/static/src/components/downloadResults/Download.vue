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
    import DownloadStatus from "./DownloadStatus.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {DownloadIcon} from "vue-feather";
    import {DownloadResultsDependency} from "../../types";

    interface downloadTranslate {
        header: string,
        button: string
    }

    interface Props {
        [key: string]: any
        file: DownloadResultsDependency,
        translateKey: downloadTranslate,
        disabled: boolean
    }

    interface Methods {
        [key: string]: any
        download: () => void
    }

    export default defineComponent<Props, unknown, unknown, {}, Methods>({
        name: "Download",
        components: {
            DownloadIcon,
            ErrorAlert,
            DownloadStatus
        },
        methods: {
            download() {
                this.$emit("click")
            }
        }
    })
</script>
