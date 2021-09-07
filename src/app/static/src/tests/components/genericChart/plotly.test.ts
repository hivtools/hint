// Mock the import of plotly so that we can spy on its exported 'react' method - need to do this
// before importing Chart
jest.mock("plotly.js-basic-dist", () => ({
    newPlot: jest.fn()
}));
import * as plotly from "plotly.js-basic-dist";
import Vue from "vue";
import { shallowMount } from "@vue/test-utils";
import Plotly from "../../../app/components/genericChart/Plotly.vue";

const chartData = {
    xVals: [1, 2, 3],
    yVals: [4, 5, 6]
};

const layoutData = {
    topMargin: 0,
    responsive: true
};

const chartMetadata = `{
    "data": {
                "x": xVals,
                "y": yVals
            },
    "layout": {
                "margin": {
                    "t": topMargin,
                    "l": xVals[0]
                }
            },
    "config": {
                "responsive": responsive,
                "height": yVals[2]
            }
}`;

describe("Plotly", () => {
    const mockPlotlyNewPlot = jest.spyOn(plotly, "newPlot");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("invokes Plotly on render with expected parameters", () => {
        const propsData = { chartMetadata, chartData, layoutData };
        shallowMount(Plotly, { propsData });

        expect(mockPlotlyNewPlot.mock.calls.length).toBe(1);
        const plotlyParams = mockPlotlyNewPlot.mock.calls[0];
        expect(plotlyParams[0].constructor.name).toBe("HTMLDivElement");
        expect(plotlyParams[1]).toStrictEqual({
            x: [1, 2, 3],
            y: [4, 5, 6]
        });
        expect(plotlyParams[2]).toStrictEqual({
            margin: {
                t: 0,
                l: 1
            }
        });
        expect(plotlyParams[3]).toStrictEqual({
            responsive: true,
            height: 6
        });
    });

    it("invokes plotly again on data change", async () => {
        const propsData = { chartMetadata, chartData, layoutData };
        const wrapper = shallowMount(Plotly, { propsData });

        wrapper.setProps({
            chartData: {
                xVals: [10, 20, 30],
                yVals: [40, 50, 60]
            }
        });
        await Vue.nextTick();

        expect(mockPlotlyNewPlot.mock.calls.length).toBe(2);
        const plotlyParams = mockPlotlyNewPlot.mock.calls[1];
        expect(plotlyParams[0].constructor.name).toBe("HTMLDivElement");
        expect(plotlyParams[1]).toStrictEqual({
            x: [10, 20, 30],
            y: [40, 50, 60]
        });
        expect(plotlyParams[2]).toStrictEqual({
            margin: {
                t: 0,
                l: 10
            }
        });
        expect(plotlyParams[3]).toStrictEqual({
            responsive: true,
            height: 60
        });
    });

    it("invokes plotly again on layout change", async () => {
        const propsData = { chartMetadata, chartData, layoutData };
        const wrapper = shallowMount(Plotly, { propsData });

        wrapper.setProps({
            layoutData: {
                topMargin: 15,
                responsive: false
            }
        });
        await Vue.nextTick();

        expect(mockPlotlyNewPlot.mock.calls.length).toBe(2);
        const plotlyParams = mockPlotlyNewPlot.mock.calls[1];
        expect(plotlyParams[0].constructor.name).toBe("HTMLDivElement");
        expect(plotlyParams[1]).toStrictEqual({
            x: [1, 2, 3],
            y: [4, 5, 6]
        });
        expect(plotlyParams[2]).toStrictEqual({
            margin: {
                t: 15,
                l: 1
            }
        });
        expect(plotlyParams[3]).toStrictEqual({
            responsive: false,
            height: 6
        });
    });

});
