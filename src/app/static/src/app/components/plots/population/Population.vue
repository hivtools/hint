<template>
  <div class="chart-wrapper">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartOptions,
} from "chart.js";
import { useStore } from "vuex";
import { RootState } from "../../../root";
import { FilterOption, IndicatorMetadata } from "../../../generated";
import { formatOutput, getIndicatorMetadata } from "../utils";
import { buildTooltipCallback } from "../bar/utils";
import { OutlinePlugin } from "./utils";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  OutlinePlugin
);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  datasets: {
    type: Array as () => Array<{
      label: string;
      data: number[];
      backgroundColor: string;
    }>,
    required: true,
  },
});

const plotName = "population";

const store = useStore<RootState>();

const ageGroups = computed(
  () => store.getters["baseline/ageGroupOptions"] as FilterOption[]
);

const plotControlGetter =
  store.getters["plotSelections/controlSelectionFromId"];

const plotTypeSelection = computed(
  () => plotControlGetter(plotName, "plot").id
);

const isProportion = computed(
  () => plotTypeSelection.value === "population_proportion"
);

const plotTypeMetadata = computed<IndicatorMetadata>(() =>
  getIndicatorMetadata(store, plotName, plotTypeSelection.value)
);

const chartData = computed(() => {
    console.log("build chart data computed")
    return {
        labels: ageGroups.value.map((group) => group.label),
        datasets: props.datasets,
    }});

const chartOptions = computed<ChartOptions<"bar">>(() => {
  // Some logic for nicely setting the min and max values on the x-axis.
  // Round to the nearest 1,000 for small datasets, nearest 10,000 otherwise.
  let xMin, xMax;

  const maxValue = Math.max(...chartData.value.datasets[0].data) || 0;
  const minValue = Math.min(...chartData.value.datasets[1].data) || 0;

  const boundaryValue = Math.max(Math.abs(minValue), Math.abs(maxValue));

  let roundingIncrement = 10_000

  if (isProportion.value) {
    roundingIncrement = 0.1
  } else if (boundaryValue < 10_000) {
    roundingIncrement = 1_000
  }
  
  const roundedBoundaryValue =
    Math.ceil(boundaryValue / roundingIncrement) * roundingIncrement;

  xMin = -roundedBoundaryValue;
  xMax = roundedBoundaryValue;

  return {
    maintainAspectRatio: true,
    responsive: true,
    aspectRatio: 1.5,
    indexAxis: "y", // Flip chart 90 degrees
    plugins: {
      legend: {
        display: false,
        position: "top",
        reverse: true,
      },
      title: {
        display: true,
        text: props.title,
        font: {
          weight: "normal",
        },
      },
      tooltip: {
        callbacks: {
          label: buildTooltipCallback(plotTypeMetadata.value, false, true),
        },
      },
    },

    scales: {
      x: {
        min: xMin,
        max: xMax,
        stacked: false,
        grid: {
          display: false,
        },
        ticks: {
          callback: (value: number | string) => {
            return formatOutput(value, plotTypeMetadata.value.format, plotTypeMetadata.value.scale, plotTypeMetadata.value.accuracy, true, true)
          },
          maxTicksLimit: 3,
          font: {
            size: 10,
          },
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };
});
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  display: flex;
}

.chart-wrapper canvas {
  width: 100%;
}
</style>
