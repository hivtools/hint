<template>
    <div>
        <download-button
            :name="'downloadIndicator'"
            :disabled="false"
            @click="download"></download-button>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import DownloadButton from "./downloadButton.vue";
    import {DownloadIndicatorPayload} from "../../../types";
    import {mapActionByName, mapStateProps} from "../../../utils";
    import {BaselineState} from "../../../store/baseline/baseline";
    import {utc} from "moment/moment";

    interface Methods {
        download: () => void
        downloadFile: (data: DownloadIndicatorPayload) => void
    }

    interface Props {
        filteredData: unknown[]
        unfilteredData: unknown[]
    }

    interface Computed {
        iso3: string
        country: string
    }

    export default Vue.extend<unknown, Methods, Computed, Props>({
        name: "DownloadPlotData",
        components: {
            DownloadButton
        },
        props: {
            unfilteredData: Array,
            filteredData: Array
        },
        computed: {
            ...mapStateProps<BaselineState, keyof Computed>("baseline", {
                iso3: state => state.iso3,
                country: state => state.country
            })
        },
        methods: {
            download() {
                const prefix = this.iso3 || this.country
                const timestamp = utc().local().format("YMMDD-HHmmss");
                const filename = `${prefix}_naomi_data-review_${timestamp}.xlsx`
                const data = {filteredData: this.filteredData, unfilteredData: this.unfilteredData}
                this.downloadFile({data, filename})
            },
            downloadFile: mapActionByName("downloadIndicator", "downloadFile"),
        }
    })
</script>