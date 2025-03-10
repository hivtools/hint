<template>
    <div>
        <table-reshape-data :data="plotData" :plot="plotName"/>
        <download-button v-if="downloadEnabled"
                         :name="'downloadFilteredData'"
                         :disabled="false"
                         @click="handleDownload"/>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { RootState } from '../../../root';
import { useStore } from 'vuex';
import { IndicatorMetadata } from '../../../generated';
import TableReshapeData from './TableReshapeData.vue';
import DownloadButton from '../timeSeries/downloadTimeSeries/DownloadButton.vue';
import { exportService } from '../../../dataExportService';
import { appendCurrentDateTime } from '../../../utils';
import { formatOutput, getIndicatorMetadata} from '../utils';
import {TableData} from "../../../store/plotData/plotData";
import { PlotName } from "../../../store/plotSelections/plotSelections";

// defines the order of headers on the excel download
const header = [ "area_id", "area_name", "area_level",
    "parent_area_id", "indicator", "calendar_quarter",
    "age_group", "sex", "formatted_mode", "formatted_mean",
    "formatted_upper", "formatted_lower", "mode",
    "mean", "upper", "lower" ];

export default defineComponent({
    components: {
        TableReshapeData,
        DownloadButton
    },
    props: {
        plotName: {
            type: String as PropType<PlotName>,
            required: true
        },
        downloadEnabled : {
            type: Boolean,
            required: true
        }
    },
    setup(props) {
        const store = useStore<RootState>();
        const plotData = computed<TableData>(() => store.state.plotData[props.plotName] as TableData);
        const filterSelections = computed(() => store.state.plotSelections[props.plotName].filters);
        const indicatorMetadata = computed<IndicatorMetadata>(() => {
            const indicator = filterSelections.value.find(f => f.stateFilterId === "indicator")!.selection[0].id;
            return getIndicatorMetadata(store, props.plotName, indicator);
        });
        const getDownloadData = () => {
            return plotData.value.map(d => {
                const features = store.state.baseline.shape?.data.features || [];
                const feature = features.find((f: any) => f.properties.area_id === d.area_id);
                const format = (value: number) => formatOutput(value,
                        indicatorMetadata.value.format || "",
                        indicatorMetadata.value.scale || null,
                        indicatorMetadata.value.accuracy || null);
                return {
                    ...d,
                    area_name: feature?.properties.area_name || "",
                    parent_area_id: feature?.properties.parent_area_id || "",
                    formatted_mode: 'mode' in d ? format(d.mode) : "",
                    formatted_mean: 'mean' in d && d.mean ? format(d.mean) : "",
                    formatted_upper: 'upper' in d ? format(d.upper) : "",
                    formatted_lower: 'lower' in d ? format(d.lower) : "",
                }
            });
        };
        const handleDownload = () => {
            const prefix = store.state.baseline.iso3 || store.state.baseline.country;
            const data = { filteredData: getDownloadData(), unfilteredData: [] };
            const filename = `${prefix}_naomi_table-data_${appendCurrentDateTime()}.xlsx`;
            exportService({ data, filename, options: { header }})
                    .addFilteredData()
                    .download();
        };
        return {
            plotData,
            handleDownload
        };
    }
});
</script>
