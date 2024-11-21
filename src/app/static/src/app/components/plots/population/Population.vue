<template>
  <div>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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

// const outlinePlugin = {
//   id: "outlinePlugin",
//   afterDatasetsDraw(chart: any) {
//     const ctx = chart.ctx;
//     ctx.save();

//     ctx.strokeStyle = "black";
//     ctx.lineWidth = 0.5;

//     const outlineData = chart.data.datasets;

//     outlineData.forEach((dataset: any, datasetIndex: number) => {
//       if (datasetIndex < 2) return;
//       const meta = chart.getDatasetMeta(datasetIndex);

//       const points: any[] = [];

//       meta.data.forEach((bar: any, index: number) => {
//         const { x, y, height, width } = bar; 

//         // Calculate the coordinates for the outer corners of the bar
//         const topY = y - height / 2 - 0.75;
//         const bottomY = y + height / 2 + 0.75;

//         points.push({ x: x, y: topY });
//         points.push({ x: x, y: bottomY });

//         // Connect top line horizontally to y-axis instead of connecting back to the starting point
//         if (index === 0) {
//           points.unshift({
//             y: topY,
//             x: datasetIndex === 2 ? x - width : x + width,
//           });
//         }
//       });

//       ctx.beginPath();
//       ctx.moveTo(points[0].x, points[0].y);
//       for (let i = 1; i < points.length; i++) {
//         ctx.lineTo(points[i].x, points[i].y);
//       }
//       ctx.stroke(); // Draw the outline
//     });

//     ctx.restore();
//   },
// };

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  // outlinePlugin
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

const chartData = computed(()=>({
  labels: ageGroups.map((group) => group.label),
  datasets: props.datasets,
}));

const chartOptions = ref<ChartOptions<"bar">>({
  responsive: false,
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
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          // Chart values are negative for males, tooltip needs to display absolute value
          const value = Math.abs(context.raw);
          return `${context.dataset.label}: ${Math.round(
            value
          ).toLocaleString()}`;
        },
      },
    },
  },

  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        callback: (value: number | string) => Math.abs(+value).toLocaleString(), // Show positive values for males on x-axis
        maxTicksLimit: 5,
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
});
</script>

<style scoped>
</style>
