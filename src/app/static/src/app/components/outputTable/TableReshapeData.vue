<template>
    <table-display :data="reshapedData" :header-name="tableLabelHeader"/>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import TableDisplay from './TableDisplay.vue';
import { useStore } from 'vuex';
import { RootState } from '../../root';
import { Filter, FilterOption } from '../../generated';

export default defineComponent({
    components: {
        TableDisplay
    },
    props: {
        data: Object
    },
    setup(props) {
        const store = useStore<RootState>();

        const features = computed(() => store.state.baseline.shape?.data.features);
        const selections = computed(() => store.state.plottingSelections.table);
        const filterDataIdtoId = computed(() => {
            const filters: Filter[] = store.getters["modelOutput/tableFilters"] || [];
            const dataIdToId: Record<string, string> = {};
            filters.forEach(f => {
                dataIdToId[f.column_id] = f.id;
            });
            return dataIdToId;
        });
        
        const presetMetadata = computed(() => {
            const currentPreset = store.state.plottingSelections.table.preset;
            const presetMetadata = store.state.modelCalibrate.metadata?.tableMetadata.presets;
            const metadata = presetMetadata?.find(m => m.defaults.id === currentPreset);
            if (currentPreset && presetMetadata && metadata) {
                return { row: metadata.defaults.row, column: metadata.defaults.column };
            }
            return null;
        });

        const reshapedData = computed(() => {
            const data = props.data;
            if (presetMetadata.value && data) {
                const reshapedData: any[] = [];
                const rowKey = presetMetadata.value.row;
                let rowOptions: FilterOption[] = [];
                // If rows are per area, generate pseudo filter options from all features in shape data
                if (rowKey === "area_id") {
                    if (features.value) {
                        rowOptions = features.value.map(f => {
                            return { id: f.properties.area_id, label: f.properties.area_name };
                        });
                    }
                } else {
                    rowOptions = selections.value.selectedFilterOptions[filterDataIdtoId.value[rowKey]];
                }
                const columnKey = presetMetadata.value.column;
                for (let i = 0; i < data.length; i++) {
                    const currentRow = data[i];
                    const rowVal = currentRow[rowKey];
                    const rowLabel = rowOptions.find(op => op.id === rowVal)?.label;
                    const index = reshapedData.findIndex(d => d.label === rowLabel);
                    if (index === -1) {
                        reshapedData.push({
                            "label": rowLabel,
                            [`mean_${currentRow[columnKey]}`]: currentRow.mean,
                            [`upper_${currentRow[columnKey]}`]: currentRow.upper,
                            [`lower_${currentRow[columnKey]}`]: currentRow.lower,
                        })
                    } else {
                        reshapedData[index][`mean_${currentRow[columnKey]}`] = currentRow.mean;
                        reshapedData[index][`upper_${currentRow[columnKey]}`] = currentRow.upper;
                        reshapedData[index][`lower_${currentRow[columnKey]}`] = currentRow.lower;
                    }
                }
                return reshapedData;
            }
            return [];
        });

        const tableLabelHeader = computed(() => {
            return presetMetadata.value?.row === "age_group" ? "Age" : presetMetadata.value?.row === "area_id" ? "Area" : "";
        });

        return {
            reshapedData,
            tableLabelHeader
        }
    },
});
</script>