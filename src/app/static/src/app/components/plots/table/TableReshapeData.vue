<template>
    <table-display v-if="tableMetadata"
                   :plot="plot"
                   :data="reshapedData"
                   :table-metadata="tableMetadata"
                   :header-defs="tableColumnDefs"/>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import TableDisplay from './TableDisplay.vue';
import { useStore } from 'vuex';
import { RootState } from '../../../root';
import {CalibrateDataResponse, FilterOption, InputComparisonData, TableMetadata} from '../../../generated';
import { FilterSelection, PlotName } from "../../../store/plotSelections/plotSelections";
import {getTableValues, TableHeaderDef} from "./utils";

export default defineComponent({
    components: {
        TableDisplay
    },
    props: {
        data: {
            type: Object as PropType<CalibrateDataResponse["data"] | InputComparisonData>,
            required: true
        },
        plot: {
            type: String as PropType<PlotName>,
            required: true
        }
    },
    setup(props) {
        const store = useStore<RootState>();

        const tableMetadata = computed<TableMetadata | undefined>(() => {
            return store.getters["modelCalibrate/tableMetadata"](props.plot);
        });

        const reshapedData = computed(() => {
            const data = props.data;
            if (tableMetadata.value && data) {
                const tableData: any[] = [];
                const rowIds = tableMetadata.value.row;
                const rowKeys = rowIds.map(rowId => store.getters["modelCalibrate/filterIdToColumnId"](props.plot, rowId));
                const rowOptionsList: FilterOption[][] = rowIds.map(rowId => store.getters["plotSelections/filterSelectionFromId"](props.plot, rowId));
                const columnKey = tableMetadata.value.column[0];
                for (let i = 0; i < data.length; i++) {
                    const currentRow = data[i];
                    // Create an object with individual row label mappings
                    const rowLabels = rowIds.reduce((acc, rowId, idx) => {
                        const rowKey = rowKeys[idx];
                        const rowVal: string | number = currentRow[rowKey];
                        const label = rowOptionsList[idx].find((op: FilterOption) => op.id === String(rowVal))?.label || "";
                        if (label) {
                            acc[rowId] = label; // Use rowId as the key and label as the value
                        }
                        return acc;
                    }, {} as Record<string, string>);

                    // Check if an entry with matching row labels already exists
                    const index = tableData.findIndex(d =>
                        rowIds.every(rowId => d[rowId] === rowLabels[rowId])
                    );
                    const tableValues = getTableValues(props.plot, columnKey, currentRow);
                    if (index === -1) {
                        tableData.push({
                            ...rowLabels,
                            ...tableValues
                        })
                    } else {
                        // Update existing entry with tableValues
                        Object.assign(tableData[index], tableValues);
                    }
                }
                return tableData;
            }
            return [];
        });

        const filterSelections = computed(() => store.state.plotSelections[props.plot].filters);

        const tableColumnDefs = computed<TableHeaderDef[]>(() => {
            // Includes base columns shown, disaggregated columns added later
            if (!tableMetadata.value || !tableMetadata.value.row) {
                return [];
            }

            return tableMetadata.value.row.map((rowId: string) => {
                const rowFilter = filterSelections.value.find((f: FilterSelection) => f.filterId === rowId);
                return {
                    columnField: rowId,
                    columnLabel: rowFilter ? rowFilter.label : rowId
                };
            })
        });

        return {
            reshapedData,
            tableMetadata,
            tableColumnDefs
        }
    },
});
</script>
