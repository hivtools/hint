<template>
    <div id="download-button">
        <button class="btn btn-sm mt-2" :class="disabled ? 'btn-secondary' : 'btn-red'"
                :disabled="disabled"
                @click="download">
            <span v-translate="name"></span>
            <download-icon size="20" class="icon ml-2"></download-icon>
        </button>
    </div>
</template>

<script lang="ts">
    import type { PropType } from "vue";
    import {defineComponent} from "vue";
    import {DownloadIcon} from "vue-feather";

    interface Props {
        [key: string]: any
        disabled: boolean
        name: string
    }

    interface Method {
        [key: string]: any
        download: () => void
    }

    export default defineComponent<Props, unknown, unknown, {}, Method>({
        name: "downloadButton",
        components: {
            DownloadIcon
        },
        methods: {
            download() {
                this.$emit("click")
            }
        }
    });
</script>
