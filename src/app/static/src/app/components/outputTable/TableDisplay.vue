<template>
    <ag-grid-vue style="height: 700px"
                    class="ag-theme-alpine"
                    :defaultColDef="defaultColDef"
                    :columnDefs="columnDefs"
                    :rowData="rowData"
                    :grid-options="gridOptions"
                    @grid-ready="onGridReady">
    </ag-grid-vue>
    <div style="margin: 10px 0;">
        <download-button :name="'Download CSV export file'" @click="exportData" :disabled="false"/>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, computed } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { AgGridEvent } from "ag-grid-community";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-alpine.css";
import { useStore } from "vuex";
import { RootState } from "../../root";
import DownloadButton from "../downloadIndicator/DownloadButton.vue";
import { Filter, FilterOption } from "../../generated";

const defaultColDef = {
    // Set the default filter type
    filter: 'agNumberColumnFilter',
    // Floating filter adds the dedicated row for filtering at the bottom
    floatingFilter: true,
    // suppressMenu hides the filter menu which showed on the column title
    // this just avoids duplication of filtering UI as we have floating turned on
    // there are some cases where other thing show in the menu but not for our example
    suppressMenu: true,
    // Show an icon when the column is not sorted
    unSortIcon: true,
    // Make column sortable
    sortable: true,
    flex: 1,
    minWidth: 75,
    // Stop the columns from being draggable to rearrange order or remove them
    suppressMovable: true,
};

const gridOptions = {
    // Turn on pagination!
    // paginationAutoPageSize: true,
    // pagination: true
}

const dataToMetadata: Record<string, string> = {
    age_group: "age",
    area_id: "area",
    calendar_quarter: "quarter",
    sex: "sex",
    area_level: "area_level"
}

export default defineComponent({
    props: {
        data: Object,
        featuresByLevel: Array
    },
    components: {
    AgGridVue,
    DownloadButton
},
    setup(props) {
        const gridApi = ref();
        const onGridReady = (event: AgGridEvent) => {
            gridApi.value = event.api;
        };

        const store = useStore<RootState>();

        const presetMetadata = computed(() => {
            const currentPreset = store.state.plottingSelections.table.preset;
            const presetMetadata = store.state.modelCalibrate.metadata?.tableMetadata.presets;
            const metadata = presetMetadata?.find(m => m.defaults.id === currentPreset);
            if (currentPreset && presetMetadata && metadata) {
                return { row: metadata.defaults.row, column: metadata.defaults.column };
            }
            return null;
        });
        const selections = computed(() => store.state.plottingSelections.table);
        const features = computed(() => store.state.baseline.shape?.data.features);


        const rowData = computed(() => {
            const data = props.data;
            if (presetMetadata.value && data) {
                const reshapedData: any[] = [];
                const rowKey = presetMetadata.value.row;
                let rowOptions: FilterOption[];
                if (rowKey === "area_id") {
                    if (features.value) {
                        rowOptions = features.value.map(f => {
                            const properties = f.properties;
                            return { id: properties.area_id, label: properties.area_name };
                        });
                    } else {
                        rowOptions = [];
                    }
                } else {
                    rowOptions = selections.value.selectedFilterOptions[dataToMetadata[presetMetadata.value.row]];
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

        // I think in prod we'll want to use our consistent formatter. Just put this here for prototype.
        // One thing which might be a bit fiddly is where we show the units. If we put the unit (e.g. here
        // prevalence is a %) in the column header then users can just filter like a number
        // If we want to put that in each cell then we're going to have to work out how to get
        // the filtering working
        const formatPercent = (value: number) => Math.round(value * 100) / 100;
        const percentGetter = (sex: string) => {
            return (params: any) => formatPercent(params.data["mean_" + sex]);
        };
        const percentFormatter = (sex: string) => {
            return (params: any) => {
                const sexSelections = selections.value.selectedFilterOptions["sex"].map(op => op.id);
                if (!sexSelections.includes(sex)) return "";
                return params.value + ' (' +
                    formatPercent(params.data["lower_" + sex]) + ' - ' +
                    formatPercent(params.data["upper_" + sex]) + ')'
            };
        };

        const columnDefs = computed(() => {
            return [
                {
                    headerName: presetMetadata.value?.row === "age_group" ? "Age" : presetMetadata.value?.row === "area_id" ? "Area" : "",
                    field: "label",
                    // Override default filter type
                    filter: 'agTextColumnFilter'
                },
                {
                    headerName: "Both",
                    // The getter here sets the value in the table, this is the value which is filtered,
                    // and which gets downloaded from the export
                    valueGetter: percentGetter('both'),
                    // The formatter separately adds the lower and upper uncertainty ranges
                    // this is just for display and doesn't affect filtering
                    valueFormatter: percentFormatter('both'),
                },
                {
                    headerName: "Male",
                    valueGetter: percentGetter('male'),
                    valueFormatter: percentFormatter('male'),
                },
                {
                    headerName: "Female",
                    valueGetter: percentGetter('female'),
                    valueFormatter: percentFormatter('female'),
                },
            ];
        });

        const exportData = () => gridApi.value?.exportDataAsCsv();

        return {
            onGridReady,
            exportData,
            columnDefs,
            defaultColDef,
            gridOptions,
            rowData
        }
    }
});
</script>