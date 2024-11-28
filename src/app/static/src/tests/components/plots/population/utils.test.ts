import {OutlinePlugin} from "../../../../app/components/plots/population/utils";
import {PopulationChartDataset} from "../../../../app/store/plotSelections/plotSelections";

describe("population utils", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Mock canvas context
    const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: "",
        lineWidth: 0,
    };

    it("outline plugin draws line", async () => {
        const mockChart = {
            ctx: mockCtx,
            data: {
                datasets: [
                    { data: [-1, -2], label: "Male", isOutline: false, isMale: true },
                    { data: [-3, -4], label: "Male", isOutline: true, isMale: true },
                    { data: [5, 6], label: "Female", isOutline: true, isMale: false },
                ] as PopulationChartDataset[],
            },
            getDatasetMeta: vi.fn((datasetIndex) => ({
                data: [
                    { x: 40, y: 20, height: 30, width: 15 }, // Bar 1
                    { x: 50, y: 60, height: 30, width: 15 }, // Bar 2
                ],
            })),
        };

        OutlinePlugin.afterDatasetsDraw(mockChart);

        // Not going to check the actual values here, the playwright test should be enough
        // for that, and it is quite fiddly. We should be able to check we have the right number of steps though
        // This should be (no of outlines drawn) * (no of bars for this outline) * 2 points for each bar = 8
        expect(mockCtx.moveTo).toHaveBeenCalledTimes(2);
        expect(mockCtx.lineTo).toHaveBeenCalledTimes(8);
    });

    it("outline plugin draws no line if not an outline type", async () => {
        const mockChart = {
            ctx: mockCtx,
            data: {
                datasets: [
                    { data: [-1, -2], label: "Male", isOutline: false, isMale: true },
                    { data: [-3, -4], label: "Female", isOutline: false, isMale: false },
                ] as PopulationChartDataset[],
            },
            getDatasetMeta: vi.fn((datasetIndex) => ({
                data: [
                    { x: 40, y: 20, height: 30, width: 15 }, // Bar 1
                    { x: 50, y: 60, height: 30, width: 15 }, // Bar 2
                ],
            })),
        };

        OutlinePlugin.afterDatasetsDraw(mockChart);

        expect(mockCtx.moveTo).toHaveBeenCalledTimes(0);
        expect(mockCtx.lineTo).toHaveBeenCalledTimes(0);
    });
})
