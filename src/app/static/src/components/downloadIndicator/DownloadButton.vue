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
    import {defineComponent} from "vue";
    import {DownloadIcon} from "vue-feather";

    interface Props {
        disabled: boolean
        name: string
    }

    interface Method {
        download: () => void
    }

    export default defineComponent<unknown, Method, unknown, Props>({
        name: "downloadButton",
        components: {
            DownloadIcon
        },
        props: {
            name: String,
            disabled: Boolean
        },
        methods: {
            download() {
                this.$emit("click")
            }
        }
    });
</script>
