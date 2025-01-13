// Custom ChartJS plugin for drawing stepped national population outline on input population pyramid plots.
// Visible when "Population proportion" is selected as the plot type for population pyramids.

import { PopulationChartDataset } from "../../../store/plotSelections/plotSelections";

export const OutlinePlugin = {
    id: "outlinePlugin",
    afterDatasetsDraw(chart: any) {
        const ctx = chart.ctx;
        ctx.save();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        const outlineData: PopulationChartDataset[] = chart.data.datasets;

        outlineData.forEach((dataset: PopulationChartDataset, datasetIndex: number) => {
            if (!dataset.isOutline) return;
            const meta = chart.getDatasetMeta(datasetIndex);

            const points: any[] = [];

            meta.data.forEach((bar: any, index: number) => {
                const {x, y, height, width} = bar;

                // Calculate the coordinates for the outer corners of the bar
                const topY = y - height / 2 - 1;
                const bottomY = y + height / 2 + 1;

                // Connect top line horizontally to y-axis instead of connecting back to the starting point
                if (index === 0) {
                    points.push({
                        y: topY,
                        x: dataset.isMale ? x + width : x - width,
                    });
                }

                points.push({x: x, y: topY});
                points.push({x: x, y: bottomY});

            });

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        });

        ctx.restore();
    },
};
