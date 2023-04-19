<template>
    <div>
        <div v-if="preparing" id="preparing" class="d-flex align-items-end">
            <loading-spinner size="xs"></loading-spinner>
            <div class="d-flex align-items-center height-40 ml-2'">
                <span v-translate="translateKey"></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2"
    import LoadingSpinner from "../LoadingSpinner.vue";

    interface Props {
        preparing: boolean,
        translateKey: string
    }
    export default defineComponentVue2WithProps<unknown, unknown, unknown, Props>({
        name: "DownloadStatus",
        components: {
            LoadingSpinner
        },
        props: {
            preparing: {
              required: true,
              type: Boolean
          },
            translateKey: {
              required: true,
              type: String
            }
        }
    })
</script>