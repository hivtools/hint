<template>
  <div class="chart-grid">
    <population
      v-for="(item, index) in chartData"
      :key="index"
      :title="item.title || 'test'"
      :datasets="item.datasets"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { PopulationResponseData } from "../../../generated";
import Population from "./Population.vue";
import { useStore } from "vuex";
import { RootState } from "../../../root";

const store = useStore<RootState>();

const data = computed(
  () => store.state.plotData.population as PopulationResponseData
);

const ageGroups: { id: string; label: string }[] = [
  { id: "Y080_999", label: "80+" },
  { id: "Y075_079", label: "75-79" },
  { id: "Y070_074", label: "70-74" },
  { id: "Y065_069", label: "65-69" },
  { id: "Y060_064", label: "60-64" },
  { id: "Y055_059", label: "55-59" },
  { id: "Y050_054", label: "50-54" },
  { id: "Y045_049", label: "45-49" },
  { id: "Y040_044", label: "40-44" },
  { id: "Y035_039", label: "35-39" },
  { id: "Y030_034", label: "30-34" },
  { id: "Y025_029", label: "25-29" },
  { id: "Y020_024", label: "20-24" },
  { id: "Y015_019", label: "15-19" },
  { id: "Y010_014", label: "10-14" },
  { id: "Y005_009", label: "5-9" },
  { id: "Y000_004", label: "0-4" },
];

const parsePopulationPyramidData = (
  indicators: PopulationResponseData,
  isOutline: boolean
) => {
  const femalePopulations: number[] = new Array(ageGroups.length).fill(0);
  const malePopulations: number[] = new Array(ageGroups.length).fill(0);

  indicators.forEach((item) => {
    const ageIndex = ageGroups.findIndex(
      (group) => group.id === item.age_group
    );
    if (ageIndex !== -1) {
      if (item.sex === "female") {
        femalePopulations[ageIndex] += item.population;
      } else if (item.sex === "male") {
        malePopulations[ageIndex] += item.population;
      }
    }
  });

  return [
    {
      label: "Female",
      data: femalePopulations,
      backgroundColor: isOutline ? "transparent" : "#5c96c5",
    },
    {
      label: "Male",
      data: malePopulations.map((pop) => -pop), // Negate male values for the left side of the pyramid
      backgroundColor: isOutline ? "transparent" : "#48b342",
    },
  ];
};

const groupPopulationPyramidDataByArea = (data: PopulationResponseData) => {
  const groupedData: Record<string, PopulationResponseData> = {};

  // NOTE: Country data for stepped outline
  // const countryData = parsePopulationPyramidData(data, true);

  // Group data by area_id
  data.forEach((item) => {
    if (!groupedData[item.area_id]) {
      groupedData[item.area_id] = [];
    }
    groupedData[item.area_id].push(item);
  });

  const result = Object.values(groupedData).map((indicators) => {
    return {
      title: indicators[0].area_name,
      datasets: [
        ...parsePopulationPyramidData(indicators, false),
        // ...countryData,
      ],
    };
  });
  return result;
};

const chartData = computed(()=> groupPopulationPyramidDataByArea(data.value));

</script>

<style scoped>
.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 800px;
}
</style>
