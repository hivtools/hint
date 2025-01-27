<template>
    <div class="col-9 time-series">
        <div
            :key="spaceNeededForPlots"
            class="chart-container"
            ref="chartContainer"
            style="height: 640px"
        >
            <div v-if="chartDataForPage.length > 0">
                <plotly
                    class="chart"
                    :chart-data="chartDataForPage"
                    :layout="layout"
                    :style="{ height: spaceNeededForPlots }"
                    :page-number="pageNumber"
                    @open-context="handleOpenContext"
                />
                <input
                    v-for="checkbox in visibleCheckboxes"
                    :key="`checkbox-${checkbox.id}`"
                    type="checkbox"
                    :checked="checkbox.checked"
                    :style="{
                        position: 'absolute',
                        top: checkbox.top,
                        left: checkbox.left,
                    }"
                    @change="checkbox.onChange"
                />
            </div>
            <div
                v-else
                class="mt-5"
                id="empty-generic-chart-data"
            >
                <div class="empty-chart-message px-3 py-2">
                    <span class="lead">
                        <strong v-translate="'noChartData'"></strong>
                    </span>
                </div>
            </div>
        </div>
        <button
            class="btn btn-sm mt-2"
            :class="'btn-red'"
            :style="{ zIndex: 100 }"
            @click="handleShowChecked"
        >
            <span v-translate="showChecked ? 'showAll' : 'showSelected'"></span>
        </button>

        <page-control
            v-if="totalPages > 1"
            class="page-controls"
            :page-number="pageNumber"
            :total-pages="totalPages"
            @set-page="(newPageNumber: number) => pageNumber = newPageNumber"
        />
        <time-series-modal
            v-if="contextModalOpen"
            id="time-series-modal"
            :open-modal="contextModalOpen"
            :area-id="contextModalAreaId"
            :plot-type="contextModalPlotType"
            @close-modal="() => (contextModalOpen = false)"
        />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, ref, watch } from "vue";
import { useStore } from "vuex";
import { RootState } from "../../../root";
import { InputPlotName, PlotSelectionsState } from "../../../store/plotSelections/plotSelections";
import { ReviewInputDataColumnValue } from "../../../types";
import { numeralJsToD3format } from "./utils";
import Plotly from "./Plotly.vue";
import PageControl from "./PageControl.vue";
import { InputTimeSeriesData } from "../../../generated";
import { InputTimeSeriesKey } from "../../../store/plotData/plotData";
import TimeSeriesModal from "./TimeSeriesModal.vue";
import { onMounted } from "vue";
import { nextTick } from "vue";

const plot = "timeSeries" as InputPlotName;

const subplotsConfig = {
    columns: 3,
    distinctColumn: "area_id",
    heightPerRow: 160,
    subplotsPerPage: 12,
};

export default defineComponent({
    components: {
        TimeSeriesModal,
        Plotly,
        PageControl,
    },
    setup() {
        const store = useStore<RootState>();
        const pageNumber = ref<number>(1);
        watch(
            () => store.state.plotSelections[plot],
            (oldState: PlotSelectionsState["timeSeries"], newState: PlotSelectionsState["timeSeries"]) => {
                const oldAreaLevel = oldState.filters.find((f) => f.filterId.includes("area_level"))?.selection[0].id;
                const newAreaLevel = newState.filters.find((f) => f.filterId.includes("area_level"))?.selection[0].id;
                if (oldAreaLevel !== newAreaLevel) {
                    // Reset only when the area level changes, all other filters and controls
                    // won't affect the number of plots, so keep the paging to make comparing easier
                    pageNumber.value = 1;
                }
            }
        );

        const valueFormat = computed(() => {
            const plotTypeFilter = store.state.plotSelections[plot].filters.find(
                (f) => f.stateFilterId === "plotType"
            )!;
            const selectionId = plotTypeFilter.selection[0].id;
            const filterType = store.state.metadata.reviewInputMetadata!.filterTypes.find(
                (ft) => ft.id === plotTypeFilter.filterId
            )!;
            const { format } = filterType.options.find((op) => op.id === selectionId) as ReviewInputDataColumnValue;
            if (!format) return "";
            return numeralJsToD3format(format);
        });

        const chartData = computed(() => store.state.plotData[plot] as InputTimeSeriesData);

        const distinctPlots = computed(() => {
            const { distinctColumn } = subplotsConfig;
            let plots = chartData.value.reduce((dp, data) => {
                // will be string as distinct plots are defined by area_id
                const value = data[distinctColumn as InputTimeSeriesKey] as string;
                return [...dp, ...(dp.includes(value) ? [] : [value])];
            }, [] as string[]);
            // filtering checked plots must be done here for pagination to work correctly
            if (showChecked.value) {
                plots = plots.filter((p) => checkedIds.value.includes(p));
            }
            return plots;
        });

        const totalPages = computed(() => {
            return Math.ceil(distinctPlots.value.length / subplotsConfig.subplotsPerPage);
        });

        const visiblePlots = computed(() => {
            const { subplotsPerPage } = subplotsConfig;
            const startIndex = (pageNumber.value - 1) * subplotsPerPage;
            const endIndex = pageNumber.value * subplotsPerPage;
            return distinctPlots.value.slice(startIndex, endIndex);
        });

        const chartDataForPage = computed(() => {
            const { distinctColumn } = subplotsConfig;
            return chartData.value.reduce((vcd, data) => {
                const value = data[distinctColumn as InputTimeSeriesKey] as string;
                return [...vcd, ...(visiblePlots.value.includes(value) ? [data] : [])];
            }, [] as InputTimeSeriesData);
        });

        const rows = computed(() => {
            return Math.ceil(visiblePlots.value.length / subplotsConfig.columns);
        });

        const spaceNeededForPlots = computed(() => {
            return `${Math.min(subplotsConfig.heightPerRow * rows.value! + 70, 640)}px`;
        });

        const layout = computed(() => {
            return {
                yAxisFormat: valueFormat.value,
                subplots: {
                    ...subplotsConfig,
                    rows: rows.value,
                },
            };
        });

        const contextModalOpen = ref<boolean>(false);
        const contextModalAreaId = ref<string>("");
        const contextModalPlotType = ref<string>("");
        const handleOpenContext = (areaId: string, plotType: string) => {
            contextModalOpen.value = true;
            contextModalAreaId.value = areaId;
            contextModalPlotType.value = plotType;
        };

        // Checkboxes

        const chartContainer = ref<HTMLElement | null>(null);

        const chartContainerSize = ref({
            width: 0,
            height: 0,
        });

        const checkedIds = ref<string[]>([]);

        const showChecked = ref<boolean>(false);

        const numRenderedColumns = computed(() => {
            return Math.min(visiblePlots.value.length, subplotsConfig.columns);
        });

        const visibleCheckboxes = computed(() => {
            const filtered = visiblePlots.value;

            return filtered.map((id, i) => ({
                id,
                top: `${Math.floor(i / 3) * (chartContainerSize.value.height / rows.value) + 16 + Math.floor(i / 3)}px`,
                left: `${
                    (i % numRenderedColumns.value) * (chartContainerSize.value.width / numRenderedColumns.value) + (60-i%numRenderedColumns.value*6)
                }px`,
                checked: checkedIds.value.includes(id),
                onChange: () => {
                    if (checkedIds.value.includes(id)) {
                        checkedIds.value = checkedIds.value.filter((c) => c !== id);
                    } else {
                        checkedIds.value = [...checkedIds.value, id];
                    }
                },
            }));
        });

        const handleShowChecked = () => {
            showChecked.value = !showChecked.value;
        };

        const updateChartContainerSize = () => {
            const svg = document.querySelector(".main-svg");

            const container = svg?.querySelector(".cartesianlayer");

            if (container) {
                const { width, height } = container.getBoundingClientRect();
                chartContainerSize.value.width = width;
                chartContainerSize.value.height = height;
            }
        };

        watch(showChecked, () => {
            pageNumber.value = 1;
        });

        watch([rows, numRenderedColumns], () => {
            nextTick(() => {
                updateChartContainerSize();
            });
        });

        onMounted(() => {
            updateChartContainerSize();
            window.addEventListener("resize", updateChartContainerSize);
        });

        onUnmounted(() => {
            window.removeEventListener("resize", updateChartContainerSize);
        });

        return {
            chartDataForPage,
            layout,
            spaceNeededForPlots,
            pageNumber,
            totalPages,
            contextModalOpen,
            contextModalAreaId,
            contextModalPlotType,
            handleOpenContext,
            visibleCheckboxes,
            handleShowChecked,
            showChecked,
            chartContainerSize,
            chartContainer,
        };
    },
});
</script>

<style scoped>
.time-series {
    position: relative;
    margin-top: 0.75rem;
    padding: 0;
}

.chart-container {
    border: transparent;
    overflow-y: hidden;
}

.page-controls {
    position: absolute;
    bottom: 0;
    margin-bottom: 0;
    width: 100%;
    justify-content: center;
}
</style>
