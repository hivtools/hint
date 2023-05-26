// Mock the import of plotly so that we can spy on its exported 'newPlot' method - need to do this
// before importing Plotly
import Vuex from "vuex";

jest.mock("plotly.js-basic-dist", () => ({
    newPlot: jest.fn(),
    react: jest.fn()
}));
import * as plotly from "plotly.js-basic-dist";
import Vue, { nextTick } from "vue";
import { shallowMount } from "@vue/test-utils";
import Plotly from "../../../app/components/genericChart/Plotly.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated, shallowMountWithTranslate} from "../../testHelpers";

const chartData = {
    xVals: [1, 2, 3],
    yVals: [4, 5, 6]
};

const layoutData = {
    topMargin: 0,
    responsive: true,
    subplots: {
        rows: 2
    }
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
    const mockPlotlyReact = jest.spyOn(plotly, "react");
    const mockPlotlyNewPlot = jest.spyOn(plotly, "newPlot");
    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const expectPlotlyParams = (plotlyParams: any[]) => {
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
    };

    it("invokes Plotly on render with expected parameters", (done) => {
        const props = { chartMetadata, chartData, layoutData };
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

    it("invokes Plotly newPlot when layout subplot rows has changed", (done) => {
        const props = { chartMetadata, chartData, layoutData };
        const wrapper = shallowMount(Plotly, { props, store });
        setTimeout(async () => {
            expect(mockPlotlyNewPlot.mock.calls.length).toBe(0);
            await wrapper.setProps({
                chartMetadata,
                chsrtData: {...chartData},
                layoutData: {
                    ...layoutData,
                    subplots: {
                        rows: 3
                    }
                }
            });
            setTimeout(() => {
                expect(mockPlotlyNewPlot.mock.calls.length).toBe(1);
                expectPlotlyParams(mockPlotlyNewPlot.mock.calls[0]);
                expect((wrapper.vm as any).rendering).toBe(false);

                done();
            });
        });
    });

    it("invokes plotly again on data change", (done) => {
       const props = { chartMetadata, chartData, layoutData };
       const wrapper = shallowMount(Plotly, { props, store });

       setTimeout(async () => {
           await wrapper.setProps({
               chartData: {
                   xVals: [10, 20, 30],
                   yVals: [40, 50, 60]
               }
           });

           setTimeout(() => {
               expect(mockPlotlyReact.mock.calls.length).toBe(2);
               const plotlyParams = mockPlotlyReact.mock.calls[1];
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

               done();
           });
       });
    });

    it("invokes plotly again on layout change", (done) => {
        const props = { chartMetadata, chartData, layoutData };
        const wrapper = shallowMount(Plotly, { props, store });
        setTimeout(async () => {
            await wrapper.setProps({
                layoutData: {
                    topMargin: 15,
                    responsive: false
                }
            });

            setTimeout(() => {

                expect(mockPlotlyReact.mock.calls.length).toBe(2);
                const plotlyParams = mockPlotlyReact.mock.calls[1];
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
                done();
            });
        });
    });

    it("does not render loading spinner when rendering flag is false", () => {
        const props = { chartMetadata, chartData, layoutData };
        const wrapper = shallowMount(Plotly, { props, store });
        (wrapper.vm as any).rendering = false;
        expect( wrapper.find("div.text-center").exists()).toBe(false);
        expect((wrapper.find("#chart").element as HTMLElement).style.visibility).toBe("visible");
    });

    it("renders loading spinner when rendering flag is true", async () => {
        const props = { chartMetadata, chartData, layoutData };
        const wrapper = shallowMountWithTranslate(Plotly, store, { props, global: {plugins: [store]} });
        (wrapper.vm as any).rendering = true;
        await nextTick();
        const spinnerDiv = wrapper.find("div.text-center");
        expect(spinnerDiv.findComponent(LoadingSpinner).props("size")).toBe("lg");
        await expectTranslated(spinnerDiv.find("h2"), "Loading chart",
            "Chargement du graphique", "Carregando o gráfico", store);
        expect((wrapper.find("#chart").element as HTMLElement).style.visibility).toBe("hidden");
    });
});
