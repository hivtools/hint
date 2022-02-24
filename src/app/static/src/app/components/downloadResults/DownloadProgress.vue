<template>
    <div>
        <div v-if="downloading" id="downloading" class="d-flex align-items-end">
            <loading-spinner size="xs"></loading-spinner>
            <div class="d-flex align-items-center height-40 ml-2'">
                <span v-translate="translateKey"></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue"
    import LoadingSpinner from "../LoadingSpinner.vue";

    interface Props {
        downloading: boolean,
        translateKey: string
    }
    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "DownloadProgress",
        components: {
            LoadingSpinner
        },
        props: {
            downloading: {
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