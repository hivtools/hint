<template>
  <div class="wrapper" v-if="chartData.length > 0">
    <div class="chart-grid">
      <population
        v-for="(item, index) in visiblePlots"
        :key="index"
        :title="item.title"
        :datasets="item.datasets"
      />
    </div>
    <page-control
      v-if="totalPages > 1"
      class="page-controls"
      :page-number="pageNumber"
      :total-pages="totalPages"
      @set-page="(newPageNumber: number) => pageNumber = newPageNumber"
    />
  </div>
  <div v-else class="mt-5" id="empty-generic-chart-data">
    <div class="empty-chart-message px-3 py-2">
      <span class="lead">
        <strong v-translate="'noChartData'"></strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { FilterOption } from "../../../generated";
import Population from "./Population.vue";
import { useStore } from "vuex";
import { RootState } from "../../../root";
import PageControl from "../timeSeries/PageControl.vue";
import {PlotSelectionsState, PopulationChartData} from "../../../store/plotSelections/plotSelections";
import {PopulationPyramidData} from "../../../store/plotData/plotData";

const subplotsConfig = {
  columns: 3,
  rows: 3,
};

const plotName = "population"

const store = useStore<RootState>();

const pageNumber = ref<number>(1);

watch(
    () => store.state.plotSelections["population"],
    (oldState: PlotSelectionsState["timeSeries"], newState: PlotSelectionsState["timeSeries"]) => {
        console.log(oldState)
        const oldAreaLevel = oldState.filters.find(f => f.filterId == "area_level")?.selection[0].id;
        const newAreaLevel = newState.filters.find(f => f.filterId == "area_level")?.selection[0].id;
        const oldAreas = oldState.filters.find(f => f.filterId == "area")?.selection;
        const newAreas = newState.filters.find(f => f.filterId == "area")?.selection;

        if (oldAreaLevel !== newAreaLevel || oldAreas?.length != newAreas?.length ) {
            // Reset only when the area or area level changes, all other filters and controls
            // won't affect the number of plots, so keep the paging to make comparing easier
            pageNumber.value = 1
        }
    }
);

const data = computed(
  () => store.state.plotData.population as PopulationPyramidData
);

const ageGroups = computed(
  () => store.getters["reviewInput/ageGroupOptions"] as FilterOption[]
);

const chartDataGetter = store.getters["plotSelections/populationChartData"];

const chartData = computed<PopulationChartData>(() => chartDataGetter(plotName, data.value, ageGroups.value));

const totalPages = computed(() => {
  return Math.ceil(
    chartData.value.length / (subplotsConfig.columns * subplotsConfig.rows)
  );
});

const visiblePlots = computed(() => {
  const subplotsPerPage = subplotsConfig.columns * subplotsConfig.rows;
  const startIndex = (pageNumber.value - 1) * subplotsPerPage;
  const endIndex = pageNumber.value * subplotsPerPage;
  return chartData.value.slice(startIndex, endIndex);
});
</script>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}
.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 12px 0px;
}
</style>
