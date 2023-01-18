<template>
    <div>
        <download-button
            :name="'downloadPlotData'"
            :disabled="false"
            @click="download"></download-button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import DownloadButton from "./downloadButton.vue";
    import {DownloadPlotData} from "../../../types";
    import {mapGettersByNames} from "../../../utils";

    interface Methods {
        download: () => void
    }

    interface Props {
        filteredData: unknown[]
        unfilteredData: unknown[]
    }

    interface ComputedGetters {
        downloadFile: (data: DownloadPlotData) => void
    }

    export default Vue.extend<unknown, Methods, ComputedGetters, Props>({
        name: "DownloadPlotData",
        components: {
            DownloadButton
        },
        props: {
            unfilteredData: Array,
            filteredData: Array
        },
        computed: {
            ...mapGettersByNames<keyof ComputedGetters>("plottingSelections", ['downloadFile'])
        },
        methods: {
            download() {
                const data = {filteredData: this.filteredData, unfilteredData: this.unfilteredData}
                this.downloadFile(data)
            }
        }
    })
</script>