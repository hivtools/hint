<template>
  <div id="download">
    <h4 v-translate="translateKey.header"></h4>
    <button class="btn btn-red btn-lg my-3"
            :disabled="file.downloading"
            @click="download">
      <span v-translate="translateKey.button"></span>
      <download-icon size="20" class="icon ml-2" style="margin-top: -4px;"></download-icon>
    </button>
    <div>
      <download-progress v-if="!modalOpen" id="progress"
                         :translate-key="'downloading'"
                         :downloading="file.downloading"/>
    </div>
    <error-alert id="error" v-if="file.error" :error="file.error"></error-alert>
  </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import DownloadProgress from "./DownloadProgress.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {DownloadIcon} from "vue-feather-icons";
    import {DownloadResultsDependency} from "../../types";

    interface downloadTranslate {
        header: string,
        button: string
    }

    interface Props {
        file: DownloadResultsDependency,
        translateKey: downloadTranslate,
        modalOpen: boolean
    }

    interface Methods {
        download: () => void
    }

    export default Vue.extend<unknown, Methods, unknown, Props>({
        name: "Download",
        components: {
          DownloadIcon,
          ErrorAlert,
          DownloadProgress
        },
        props: {
          file: {
            required: true,
            type: Object
         },
          translateKey: {
            required: true,
            type: Object
          },
          modalOpen: {
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
