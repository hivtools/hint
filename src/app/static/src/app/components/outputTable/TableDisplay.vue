<template>
    <ag-grid-vue style="height: 700px"
                 class="ag-theme-alpine"
                 :defaultColDef="defaultColDef"
                 :columnDefs="columnDefs"
                 :rowData="data"
                 @grid-ready="onGridReady">
    </ag-grid-vue>
</template>

<script lang="ts">
import { ref, defineComponent, computed, onUpdated } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { AgGridEvent } from "ag-grid-community";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-alpine.css";
import { useStore } from "vuex";
import { RootState } from "../../root";
import DownloadButton from "../downloadIndicator/DownloadButton.vue";
import { formatOutput } from "../plots/utils";

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
    // Stop the columns from being draggable to rearrange order or remove them
    suppressMovable: true,
    // our auto resize will apply to columns not shown on the screen
    // e.g. if they are off to the side, we wont get auto resize
    // because ag grid does this automatically
    suppressColumnVirtualisation: true
};

export default defineComponent({
    props: {
        data: Object,
        headerName: String
    },
    components: {
        AgGridVue,
        DownloadButton
    },
    setup(props) {
        const gridApi = ref<AgGridEvent | null>(null);

        const ensureColumnsWideEnough = (event: AgGridEvent) => {
            event.columnApi.autoSizeAllColumns();
            const columns = event.columnApi.getAllGridColumns();
            const columnLimits = columns.map(col => {
                return { key: col.getColId(), minWidth: col.getActualWidth() };
            });
            event.api.sizeColumnsToFit({ columnLimits })
        };

        const onGridReady = (event: AgGridEvent) => {
            gridApi.value = event;
            ensureColumnsWideEnough(event);
        };

        const store = useStore<RootState>();
        const selections = computed(() => store.state.plottingSelections.table);

        const indicatorFormatConfig = computed(() => {
            const indicators = store.state.modelCalibrate.metadata?.plottingMetadata.choropleth.indicators;
            if (!indicators) return { format: null, scale: null, accuracy: null };
            const currentIndicator = selections.value.indicator;
            const indicatorConfig = indicators.find(ind => ind.indicator === currentIndicator)!;
            return {
                format: indicatorConfig.format,
                scale: indicatorConfig.scale,
                accuracy: indicatorConfig.accuracy
            }
        });

        const formatValue = (value: number) => {
            const cfg = indicatorFormatConfig.value;
            return formatOutput(value, cfg.format || "", cfg.scale, cfg.accuracy);
        };
        const getValue = (sex: string) => {
            return (params: any) => formatValue(params.data["mean_" + sex]);
        };
        const getFormat = (sex: string) => {
            return (params: any) => {
                const sexSelections = selections.value.selectedFilterOptions["sex"].map(op => op.id);
                if (!sexSelections.includes(sex)) return "";
                const mean = params.value;
                const lower = formatValue(params.data["lower_" + sex]);
                const upper = formatValue(params.data["upper_" + sex]);
                return `${mean} (${lower} - ${upper})`;
            };
        };

        const columnDefs = computed(() => {
            return [
                {
                    headerName: props.headerName,
                    field: "label",
                    // Override default filter type
                    filter: 'agTextColumnFilter'
                },
                {
                    headerName: "Both",
                    // The getter here sets the value in the table, this is the value which is filtered,
                    // and which gets downloaded from the export
                    valueGetter: getValue('both'),
                    // The formatter separately adds the lower and upper uncertainty ranges
                    // this is just for display and doesn't affect filtering
                    valueFormatter: getFormat('both')
                },
                {
                    headerName: "Male",
                    valueGetter: getValue('male'),
                    valueFormatter: getFormat('male')
                },
                {
                    headerName: "Female",
                    valueGetter: getValue('female'),
                    valueFormatter: getFormat('female')
                },
            ];
        });

        onUpdated(() => {
            if (gridApi.value) {
                ensureColumnsWideEnough(gridApi.value as any);
            }
        });

        return {
            onGridReady,
            columnDefs,
            defaultColDef,
            getValue,
            getFormat,
            gridApi
        }
    }
});
</script>