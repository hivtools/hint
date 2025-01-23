<template>
    <ag-grid-vue :style="styleString"
                 class="ag-theme-alpine"
                 :defaultColDef="defaultColDef"
                 :columnDefs="columnDefs"
                 :rowData="data"
                 :grid-options="gridOptions"
                 @grid-ready="onGridReady"
                 @row-data-updated="handleRowDataChange">
    </ag-grid-vue>
</template>

<script lang="ts">
import {ref, defineComponent, computed, PropType} from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { AgGridEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useStore } from "vuex";
import { RootState } from "../../../root";
import { getIndicatorMetadata } from "../utils";
import { IndicatorMetadata, TableMetadata } from "../../../generated";
import { getColumnDefs, TableHeaderDef } from "./utils";
import { PlotName } from "../../../store/plotSelections/plotSelections";

const defaultColDef = {
    // Set the default filter type
    filter: 'agNumberColumnFilter',
    // Floating filter adds the dedicated row for filtering at the bottom
    floatingFilter: false,
    // suppressHeaderMenuButton hides the filter menu which showed on the column title
    // this just avoids duplication of filtering UI as we have floating turned on
    // there are some cases where other thing show in the menu but not for our example
    suppressHeaderMenuButton: true,
    // Show an icon when the column is not sorted
    unSortIcon: true,
    // Make column sortable
    sortable: true,
    // Stop the columns from being draggable to rearrange order or remove them
    suppressMovable: true,
    // Allow column header to wrap
    wrapHeaderText: true
};
const ROW_HEIGHT = 35;
const MAX_TABLE_HEIGHT = 700;
const gridOptions = {
    // our auto resize will apply to columns not shown on the screen
    // e.g. if they are off to the side, we won't get auto resize
    // because ag grid does this automatically
    suppressColumnVirtualisation: true,
    rowHeight: ROW_HEIGHT,
    // Reduce delay on showing tooltips to 500ms
    tooltipShowDelay: 500,
    autoSizeStrategy: {
        type: 'fitCellContents',
        skipHeader: true
    }
} as const;


export default defineComponent({
    props: {
        plot:{
            type: String as PropType<PlotName>,
            required: true
        },
        data: {
            type: Object as PropType<any[]>,
            required: true
        },
        tableMetadata: {
            type: Object as PropType<TableMetadata>,
            required: true
        },
        headerDefs: {
            type: Object as PropType<TableHeaderDef[]>,
            required: true
        }
    },
    components: {
        AgGridVue
    },
    setup(props) {
        const gridApi = ref<AgGridEvent | null>(null);
        const ensureColumnsWideEnough = (event: AgGridEvent) => {
            /*
                We auto size all columns to make sure our data fits in it however,
                the columns go to the minimum required width so sometimes we have
                a very narrow table. We would like the table to fill at least the
                whole screen.
                To fix this we use the autosize feature, then get all the widths
                of the column (these are the minimum widths required for each
                column). Size columns to fit resizes columns to fit the screen
                (using this in isolation means that the columns just equally space
                out and the data may not fit).

                We use the minimum widths that auto size gives us to have the
                columns fill the screen while also being the minWidth to fit all
                the data inside.
            */
            event.api.autoSizeAllColumns();
            const columns = event.api.getAllGridColumns();
            const columnLimits = columns.map(col => {
                return { key: col.getColId(), minWidth: col.getActualWidth() };
            });
            event.api.sizeColumnsToFit({ columnLimits })
        };
        const onGridReady = (event: AgGridEvent) => {
            gridApi.value = event;
            ensureColumnsWideEnough(event);
            handleTableResize(event);
        };
        const store = useStore<RootState>();
        const dataSource = computed<string | null>(() => store.state.reviewInput.inputComparison.dataSource);
        const filterSelections = computed(() => store.state.plotSelections[props.plot].filters);
        const indicatorMetadata = computed<IndicatorMetadata>(() => {
            const indicator = filterSelections.value.find(f => f.stateFilterId === "indicator")!.selection[0].id;
            return getIndicatorMetadata(store, props.plot, indicator);
        });
        const columnDefs = computed(() => {
            return getColumnDefs(props.plot, dataSource.value, indicatorMetadata.value, props.tableMetadata,
                filterSelections.value, props.headerDefs, store.state.language)
        });

        // We have to handle table sizing a little carefully.
        // ag-grid automatically set the height of the grid using `domLayout: autoHeight`
        // but you cannot set a max height, and it renders all data. So we need to manually
        // handle the max height by setting this dynamically when data changes.
        const styleString = ref<string>(`height: ${MAX_TABLE_HEIGHT}px`)

        const handleTableResize = (event: AgGridEvent) => {
            const filteredVisibleRowCount = event.api.getDisplayedRowCount();

            if (filteredVisibleRowCount * ROW_HEIGHT < MAX_TABLE_HEIGHT) {
                event.api.setGridOption("domLayout", "autoHeight")
                styleString.value = "";
            } else {
                event.api.setGridOption("domLayout", "normal");
                styleString.value = `height: ${MAX_TABLE_HEIGHT}px`;
            }
        };

        const handleRowDataChange = () => {
            if (gridApi.value) {
                ensureColumnsWideEnough(gridApi.value as any);
                handleTableResize(gridApi.value as any);
            }
        };
        return {
            onGridReady,
            handleRowDataChange,
            columnDefs,
            defaultColDef,
            gridOptions,
            styleString
        }
    }
});
</script>
