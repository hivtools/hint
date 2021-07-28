<template>
    <div>
    <span v-if="downloading" id="downloading" class="d-flex mt-2">
        <loading-spinner size="xs"></loading-spinner>
        <span v-translate="translateKey"></span>
    </span>
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