<template>
    <table-reshape-data :data="filteredData"/>
    <download-button :name="'downloadFilteredData'"
                     :disabled="false"
                     @click="handleDownload"/>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { RootState } from '../../root';
import { useStore } from 'vuex';
import { Filter } from '../../generated';
import TableReshapeData from './TableReshapeData.vue';
import DownloadButton from '../downloadIndicator/DownloadButton.vue';
import { exportService } from '../../dataExportService';
import { appendCurrentDateTime } from '../../utils';
import { formatOutput } from '../plots/utils';

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
    setup() {
        const store = useStore<RootState>();
        const selections = computed(() => store.state.plottingSelections.table);
        // this is necessary because filters are called
        // "age" for example on the filter selections when
        // the id in the data array is "age_group"
        const filtersIdToDataId = computed(() => {
            const filters: Filter[] = store.getters["modelOutput/tableFilters"] || [];
            const idToDataId: Record<string, string> = {};
            filters.forEach(f => {
                idToDataId[f.id] = f.column_id;
            });
            return idToDataId;
        });
        const features = computed(() => store.state.baseline.shape?.data.features || []);
        const indicators = computed(() => store.state.modelCalibrate.metadata?.plottingMetadata.choropleth.indicators || []);

        const filteredData = computed(() => {
            const result = store.state.modelCalibrate.result;
            if (!result) return []

            const data = result.data;
            const selectedOptions = selections.value.selectedFilterOptions;
            const filterKeys = Object.keys(selectedOptions);
            const selectedOptionIds: Record<string, (string | number)[]> = {};
            for (const k in selectedOptions) {
                if (k === "area_level") {
                    selectedOptionIds[k] = selectedOptions[k].map(op => parseInt(op.id));
                } else {
                    selectedOptionIds[k] = selectedOptions[k].map(op => op.id);
                }
            }
            const filteredData = [];
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row.indicator !== selections.value.indicator) continue;
                const includeRow = filterKeys.every(key => {
                    return selectedOptionIds[key].includes(row[filtersIdToDataId.value[key]]);
                })
                if (!includeRow) continue;
                filteredData.push(row);
            }
            return filteredData
        });

        const getDownloadData = (filteredData: any[]) => {
            return filteredData.map(d => {
                const feature = features.value.find(f => f.properties.area_id === d.area_id);
                const indicator = indicators.value.find(i => i.indicator === d.indicator);
                const format = (value: number) => formatOutput(value,
                                                               indicator?.format || "",
                                                               indicator?.scale || null,
                                                               indicator?.accuracy || null);
                return {
                    ...d,
                    area_name: feature?.properties.area_name || "",
                    parent_area_id: feature?.properties.parent_area_id || "",
                    formatted_mode: format(d.mode),
                    formatted_mean: format(d.mean),
                    formatted_upper: format(d.upper),
                    formatted_lower: format(d.lower)
                }
            });
        };

        const handleDownload = () => {
            const prefix = store.state.baseline.iso3 || store.state.baseline.country;
            const data = { filteredData: getDownloadData(filteredData.value), unfilteredData: [] };
            const filename = `${prefix}_naomi_table-data_${appendCurrentDateTime()}.xlsx`;
            exportService({ data, filename, options: { header }})
                .addFilteredData()
                .download();
        };

        return {
            filteredData,
            handleDownload
        };
    }
});
</script>