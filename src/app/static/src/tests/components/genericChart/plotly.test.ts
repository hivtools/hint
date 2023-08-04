// Mock the import of plotly so that we can spy on its exported 'newPlot' method - need to do this
// before importing Plotly
import Vuex from "vuex";

jest.mock("plotly.js-basic-dist", () => ({
    newPlot: jest.fn(),
    react: jest.fn()
}));
import * as plotly from "plotly.js-basic-dist";
import Vue, { nextTick } from "vue";
import { flushPromises, shallowMount } from "@vue/test-utils";
import Plotly from "../../../app/components/genericChart/Plotly.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated, shallowMountWithTranslate} from "../../testHelpers";

const chartData = (xval = "date11", yval = 1) => {
    const chartData = {
        data: [
            {
                area_id: "area_1",
                area_hierarchy: "hierarchy11",
                area_level: 4,
                area_name: "name11",
                time_period: xval,
                value: yval
            },
            {
                area_id: "area_1",
                area_hierarchy: "hierarchy12",
                area_level: 4,
                area_name: "name12",
                time_period: "date12",
                value: 2
            },
            {
                area_id: "area_2",
                area_hierarchy: "hierarchy21",
                area_level: 4,
                area_name: "name21",
                time_period: "date21",
                value: 3
            },
            {
                area_id: "area_2",
                area_hierarchy: "hierarchy22",
                area_level: 4,
                area_name: "name22",
                time_period: "date22",
                value: 4
            }
        ]
    };
    return chartData
}

const layoutData = {
    topMargin: 0,
    responsive: true,
    subplots: {
        rows: 2
    }
};

const expectedData = (xval = "date11", yval = 1) => {
    const expectedData = [
        {
            hoverTemplate: "%{x}, %{y}<br>hierarchy11<extra></extra>",
            line: {color: "rgb(51, 51, 51)"},
            name: "name11",
            showlegend: false,
            type: "scatter",
            x: [xval, "date12"],
            xaxis: "x1",
            y: [yval, 2],
            yaxis: "y1"
        },
        {
            hovertemplate: "%{x}, %{y}<br>hierarchy11<extra></extra>",
            line: {color: "rgb(255, 51, 51)"},
            name: "name11",
            showlegend: false,
            type: "scatter",
            x: [xval, "date12"],
            xaxis: "x1",
            y: [yval, 2],
            yaxis: "y1"
        },
        {
            hoverTemplate: "%{x}, %{y}<br>hierarchy21<extra></extra>",
            line: {color: "rgb(51, 51, 51)"},
            name: "name21",
            showlegend: false,
            type: "scatter",
            x: ["date21", "date22"],
            xaxis: "x2",
            y: [3, 4],
            yaxis: "y2"
        },
        {
            hovertemplate: "%{x}, %{y}<br>hierarchy21<extra></extra>",
            line: {color: "rgb(255, 51, 51)"},
            name: "name21",
            showlegend: false,
            type: "scatter",
            x: ["date21", "date22"],
            xaxis: "x2",
            y: [3, 4],
            yaxis: "y2"
        },
    ] as any;
    expectedData["sequence"] = true;
    expectedData["keepSingleton"] = true;
    expectedData[0]["x"]["sequence"] = true;
    expectedData[0]["y"]["sequence"] = true;
    expectedData[1]["x"]["sequence"] = true;
    expectedData[1]["y"]["sequence"] = true;
    expectedData[2]["x"]["sequence"] = true;
    expectedData[2]["y"]["sequence"] = true;
    expectedData[3]["x"]["sequence"] = true;
    expectedData[3]["y"]["sequence"] = true;
    return expectedData
}

const expectedLayout = (rows: number, xval = "date11") => {
    const expectedLayout = {
        annotations: [
            {
                showarrow: false,
                text: "name11 (area_1)",
                textfont: {},
                x: 0.5,
                xanchor: "middle",
                xref: "x1 domain",
                y: 1.1,
                yanchor: "middle",
                yref: "y1 domain"
            },
            {
                showarrow: false,
                text: "name21 (area_2)",
                textfont: {},
                x: 0.5,
                xanchor: "middle",
                xref: "x2 domain",
                y: 1.1,
                yanchor: "middle",
                yref: "y2 domain"
            },
        ],
        dragmode: false,
        grid: {
            columns: undefined,
            pattern: "independent",
            rows,
        },
        margin: {
            t: 32,
        },
        xaxis1: {
            autorange: true,
            tickfont: { color: "grey" },
            tickvals: [ xval, "date22" ],
            type: "category",
            zeroline: false
        },
        xaxis2: {
            autorange: true,
            tickfont: { color: "grey" },
            tickvals: [ xval, "date22" ],
            type: "category",
            zeroline: false
        },
        yaxis1: {
            autorange: true,
            domain: [ NaN, NaN ],
            rangemode: "tozero",
            tickfont: { color: "grey" },
            tickformat: undefined,
            type: "linear",
            zeroline: false
        },
        yaxis2: {
            autorange: true,
            domain: [ NaN, NaN ],
            rangemode: "tozero",
            tickfont: { color: "grey" },
            tickformat: undefined,
            type: "linear",
            zeroline: false
        },
    } as any
    expectedLayout.annotations["sequence"] = true;
    expectedLayout.annotations["keepSingleton"] = true;
    return expectedLayout
};

const expectedConfig = {
    responsive: false,
    scrollZoom: false,
    modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d', 'zoomIn2d', 'zoomOut2d']
};

describe("Plotly", () => {
    const mockPlotlyReact = jest.spyOn(plotly, "react");
    const mockPlotlyNewPlot = jest.spyOn(plotly, "newPlot");
    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const expectPlotlyParams = (plotlyParams: any[], rows = 2) => {
        expect(plotlyParams[0].constructor.name).toBe("HTMLDivElement");
        expect(plotlyParams[1]).toStrictEqual(expectedData());
        expect(plotlyParams[2]).toStrictEqual(expectedLayout(rows));
        expect(plotlyParams[3]).toStrictEqual(expectedConfig);
    };

    it("invokes Plotly on render with expected parameters", (done) => {
        const props = { chartData: chartData(), layoutData };
        const wrapper = shallowMount(Plotly, { props, store });

        // Rendering flag should be set while rendering proceeds
        expect((wrapper.vm as any).rendering).toBe(true);

        setTimeout(() => {
            expect(mockPlotlyReact.mock.calls.length).toBe(1);
            expectPlotlyParams(mockPlotlyReact.mock.calls[0]);
            expect((wrapper.vm as any).rendering).toBe(false);

            done();
        });
    });

    it("invokes Plotly newPlot when layout subplot rows has changed", async () => {
        const props = { chartData: chartData(), layoutData };
        const wrapper = shallowMount(Plotly, { props, store });
        expect(mockPlotlyNewPlot.mock.calls.length).toBe(0);
        await wrapper.setProps({
            chartData: {...chartData()},
            layoutData: {
                ...layoutData,
                subplots: {
                    rows: 3
                }
            }
        });
        // call watcher that would be triggered by layoutData change
        (wrapper.vm as any).$options.watch.layoutData.call({
            ...layoutData,
            subplots: {
                rows: 3
            }
        }, layoutData)
        await nextTick();
        expect(mockPlotlyNewPlot.mock.calls.length).toBe(1);
        expectPlotlyParams(mockPlotlyNewPlot.mock.calls[0], 3);
        expect((wrapper.vm as any).rendering).toBe(false);
    });

    it("invokes plotly again on data change", (done) => {
       const props = { chartData: chartData(), layoutData };
       const wrapper = shallowMount(Plotly, { props, store });

       setTimeout(async () => {
            await wrapper.setProps({
                chartData: chartData("date111", 1.5),
                layoutData
            });

            (wrapper.vm as any).$options.watch.chartData.handler.call(wrapper.vm);
            await nextTick();

            setTimeout(() => {
                expect(mockPlotlyReact.mock.calls.length).toBe(3);
                const plotlyParams = mockPlotlyReact.mock.calls[1];
                expect(plotlyParams[0].constructor.name).toBe("HTMLDivElement");
                expect(plotlyParams[1]).toStrictEqual(expectedData("date111", 1.5));
                expect(plotlyParams[2]).toStrictEqual(expectedLayout(2, "date111"));
                expect(plotlyParams[3]).toStrictEqual(expectedConfig);

                done();
            });
       });
    });

    it("invokes plotly again on layout change", (done) => {
        const props = { chartData: chartData(), layoutData };
        const wrapper = shallowMount(Plotly, { props, store });
        setTimeout(async () => {
            await wrapper.setProps({
                chartData: chartData(),
                layoutData: {...layoutData, responsive: false}
            });

            (wrapper.vm as any).$options.watch.layoutData.call(wrapper.vm);
            await nextTick();

            setTimeout(() => {
                expect(mockPlotlyReact.mock.calls.length).toBe(2);
                const plotlyParams = mockPlotlyReact.mock.calls[1];
                expect(plotlyParams[0].constructor.name).toBe("HTMLDivElement");
                expect(plotlyParams[1]).toStrictEqual(expectedData());
                expect(plotlyParams[2]).toStrictEqual(expectedLayout(2));
                expect(plotlyParams[3]).toStrictEqual(expectedConfig);
                done();
            });
        });
    });

    it("does not render loading spinner when rendering flag is false", () => {
        const props = { chartData: chartData(), layoutData };
        const wrapper = shallowMount(Plotly, { props, store });
        (wrapper.vm as any).rendering = false;
        expect( wrapper.find("div.text-center").exists()).toBe(false);
        expect((wrapper.find("#chart").element as HTMLElement).style.visibility).toBe("visible");
    });

    it("renders loading spinner when rendering flag is true", async () => {
        const props = { chartData: chartData(), layoutData };
        const wrapper = shallowMountWithTranslate(Plotly, store, { props, global: {plugins: [store]} });
        (wrapper.vm as any).rendering = true;
        await nextTick();
        const spinnerDiv = wrapper.find("div.text-center");
        expect(spinnerDiv.findComponent(LoadingSpinner).props("size")).toBe("lg");
        expect((wrapper.find("#chart").element as HTMLElement).style.visibility).toBe("hidden");
        await expectTranslated(spinnerDiv.find("h2"), "Loading chart",
            "Chargement du graphique", "Carregando o gráfico", store);
    });
});
