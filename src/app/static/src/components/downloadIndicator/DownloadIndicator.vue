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
    import DownloadButton from "./DownloadButton.vue";
    import {DownloadIndicatorPayload} from "../../types";
    import {appendCurrentDateTime, mapActionByName, mapStateProps} from "../../utils";
    import {BaselineState} from "../../store/baseline/baseline";
    import {DownloadIndicatorState} from "../../store/downloadIndicator/downloadIndicator";

    const namespace = "downloadIndicator";

    interface Methods {
        download: () => void
        downloadFile: (data: DownloadIndicatorPayload) => void
    }

    interface Props {
        filteredData: unknown[] | null
        unfilteredData: unknown[]
    }

    interface Computed {
        iso3: string
        country: string
        downloadingIndicator: boolean
    }

    export default Vue.extend<unknown, Methods, Computed, Props>({
        name: "downloadIndicator",
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
            }),
            ...mapStateProps<DownloadIndicatorState, keyof Computed>(namespace, {
                downloadingIndicator: state => state.downloadingIndicator
            })
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