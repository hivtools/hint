<template>
    <div id="indicator-download">
        <download-button
            :name="'downloadIndicator'"
            :disabled="!hasData"
            @click="download"></download-button>
    </div>
</template>

<script lang="ts" setup>
import DownloadButton from "./DownloadButton.vue";
import {computed} from "vue";
import {useStore} from "vuex";
import { RootState } from '../../../../root';
import {appendCurrentDateTime} from "../../../../utils";
import {exportService} from "../../../../dataExportService";
import {debounce_leading} from "../../utils";
import { InputTimeSeriesData } from "@/generated";

const store = useStore<RootState>();

const unfilteredData = computed(() => {
    const dataSource = store.state.plotSelections.timeSeries.controls.find(c => c.id === "time_series_data_source")?.selection[0].id;
    if (!dataSource) {
        return undefined
    }
    return store.state.reviewInput.datasets[dataSource]?.data
});

const chartData = computed(() => store.state.plotData.timeSeries as InputTimeSeriesData);

const hasData = computed(() => !!unfilteredData.value && !!chartData.value);

const download = debounce_leading(() => {
    const prefix = store.state.baseline.iso3 || store.state.baseline.country
    const filename = `${prefix}_naomi_data-review_${appendCurrentDateTime()}.xlsx`
    if (unfilteredData.value) {
        const payload = {
            data: {unfilteredData: unfilteredData.value, filteredData: chartData.value},
            filename
        }
        exportService(payload)
            .addUnfilteredData()
            .addFilteredData()
            .download()
    }
});

</script>
