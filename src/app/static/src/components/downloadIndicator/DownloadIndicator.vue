<template>
    <div>
        <download-button
            :name="'downloadIndicator'"
            :disabled="downloadingIndicator"
            @click="download"></download-button>
    </div>
</template>

<script lang="ts">
    import {defineComponent} from "vue";
    import type { PropType } from "vue";
    import DownloadButton from "./DownloadButton.vue";
    import {DownloadIndicatorPayload} from "../../types";
    import {appendCurrentDateTime, mapActionByName, mapStateProp} from "../../utils";
    import {BaselineState} from "../../store/baseline/baseline";
    import {DownloadIndicatorState} from "../../store/downloadIndicator/downloadIndicator";

    const namespace = "downloadIndicator";

    interface Methods {
        [key: string]: any
        download: () => void
        downloadFile: (data: DownloadIndicatorPayload) => void
    }

    interface Props {
        [key: string]: any
        filteredData: unknown[] | null
        unfilteredData: unknown[]
    }

    interface Computed {
        [key: string]: any
        iso3: string
        country: string
        downloadingIndicator: boolean
    }

    export default defineComponent<Props, unknown, unknown, Computed, Methods>({
        name: "downloadIndicator",
        components: {
            DownloadButton
        },
        computed: {
            iso3: mapStateProp<BaselineState, string>("baseline", 
                state => state.iso3
            ),
            country: mapStateProp<BaselineState, string>("baseline", 
                state => state.country
            ),
            downloadingIndicator: mapStateProp<DownloadIndicatorState, boolean>(namespace, 
                state => state.downloadingIndicator
            )
        },
        methods: {
            download() {
                const prefix = this.iso3 || this.country
                const filename = `${prefix}_naomi_data-review_${appendCurrentDateTime()}.xlsx`
                if (this.filteredData) {
                    const data = {filteredData: this.filteredData, unfilteredData: this.unfilteredData}
                    this.downloadFile({data, filename})
                }
            },
            downloadFile: mapActionByName(namespace, "downloadFile"),
        }
    })
</script>