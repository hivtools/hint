import {flushPromises, shallowMount} from "@vue/test-utils";
import BarChartWithErrors from "../../src/bar/BarChartWithErrors.vue";
import { ErrorBars } from "../../src/bar/types"
import { nextTick } from "vue";

describe("chartjsBar component", () => {

    const errorBars: ErrorBars = {
        "group1": { plus: 1.1, minus: 0.9 },
        "group2": { plus: 2.1, minus: 1.9 }
    }

    const formatFunc = (value: string | number ) => "Value " + value.toString();
    const propsData = {
        xLabel: "X Axis",
        yLabel: "Y Axis",
        yFormat: formatFunc,
        chartData: {
            labels: ["group1", "group2"],
            datasets:[
                {
                    label: "dataset1",
                    backgroundColor: "#111111",
                    data: [1,2],
                    errorBars
                }
            ]
        },
        showErrorBars: true
    } as any;

    const expectedPluginConfig = (customLegendClick: Function) => { return {
        annotation: {
            annotations: [
                {
                    borderColor: "#585858",
                    borderWidth: 1,
                    display: false,
                    drawTime: "afterDatasetsDraw",
                    label: {
                    content: "dataset1",
                    },
                    type: "line",
                    xMax: 0,
                    xMin: 0,
                    yMax: 1.1,
                    yMin: 0.9,
                },
                {
                    borderColor: "#585858",
                    borderWidth: 1,
                    display: false,
                    drawTime: "afterDatasetsDraw",
                    label: {
                    content: "dataset1",
                    },
                    type: "line",
                    xMax: 0.01090909090909091,
                    xMin: -0.01090909090909091,
                    yMax: 1.1,
                    yMin: 1.1,
                },
                {
                    borderColor: "#585858",
                    borderWidth: 1,
                    display: false,
                    drawTime: "afterDatasetsDraw",
                    label: {
                    content: "dataset1",
                    },
                    type: "line",
                    xMax: 0.01090909090909091,
                    xMin: -0.01090909090909091,
                    yMax: 0.9,
                    yMin: 0.9,
                },
                {
                    borderColor: "#585858",
                    borderWidth: 1,
                    display: false,
                    drawTime: "afterDatasetsDraw",
                    label: {
                    content: "dataset1",
                    },
                    type: "line",
                    xMax: -1,
                    xMin: -1,
                    yMax: 2.1,
                    yMin: 1.9,
                },
                {
                    borderColor: "#585858",
                    borderWidth: 1,
                    display: false,
                    drawTime: "afterDatasetsDraw",
                    label: {
                    content: "dataset1",
                    },
                    type: "line",
                    xMax: -0.9890909090909091,
                    xMin: -1.010909090909091,
                    yMax: 2.1,
                    yMin: 2.1,
                },
                {
                    borderColor: "#585858",
                    borderWidth: 1,
                    display: false,
                    drawTime: "afterDatasetsDraw",
                    label: {
                    content: "dataset1",
                    },
                    type: "line",
                    xMax: -0.9890909090909091,
                    xMin: -1.010909090909091,
                    yMax: 1.9,
                    yMin: 1.9,
                },
            ],
        },
        legend: {
            onClick: customLegendClick,
        }
    }}

    const getWrapper = () => {
        return shallowMount(BarChartWithErrors, {props: propsData});
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll("bar-stub").length).toEqual(1);
    });

    it("computes correct chart options", async () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const newChartData = {
            ...propsData.chartData,
            labels: ["group1"],
            maxValuePlusError: 0.2
        };
        await wrapper.setProps({
            ...propsData,
            chartData: newChartData
        });

        await nextTick();

        const renderedConfig = vm.chartOptions;

        //Test that the callback to construct the label based on the format func behaves as expected
        const tooltipLabelCallback = renderedConfig.tooltips.callbacks.label;
        const renderedLabel = tooltipLabelCallback({datasetIndex: 0, yLabel: 2}, newChartData);
        expect(renderedLabel).toBe("dataset1: Value 2");

        expect(renderedConfig.responsive).toBe(true);
        expect(renderedConfig.maintainAspectRatio).toBe(false);
        expect(renderedConfig.plugins).toStrictEqual(expectedPluginConfig(renderedConfig.plugins.legend.onClick));
        expect(renderedConfig.scales.y.max).toBeCloseTo(0.22);
    });

    it("correct chart options if not showErrorBars", async () => {
        const propsDataNoErrors = {
            xLabel: "X Axis",
            yLabel: "Y Axis",
            yFormat: formatFunc,
            chartData: {
                labels: ["group1", "group2"],
                datasets:[
                    {
                        label: "dataset1",
                        backgroundColor: "#111111",
                        data: [1,2],
                        errorBars
                    }
                ]
            }
        } as any;
        const wrapper = shallowMount(BarChartWithErrors, {props: propsDataNoErrors});
        const vm = (wrapper as any).vm;

        const newChartData = {
            ...propsDataNoErrors.chartData,
            labels: ["group1"],
            maxValuePlusError: 0.2
        };
        await wrapper.setProps({
            ...propsDataNoErrors,
            chartData: newChartData
        });

        await nextTick();

        const renderedConfig = vm.chartOptions;

        //Test that the callback to construct the label based on the format func behaves as expected
        const tooltipLabelCallback = renderedConfig.tooltips.callbacks.label;
        const renderedLabel = tooltipLabelCallback({datasetIndex: 0, yLabel: 2}, newChartData);
        expect(renderedLabel).toBe("dataset1: Value 2");

        expect(renderedConfig.responsive).toBe(true);
        expect(renderedConfig.maintainAspectRatio).toBe(false);
        expect(renderedConfig.hasOwnProperty("plugins")).toBe(false);
    });

    it("tooltip label callback deals with incomplete parameters", async () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const newChartData = {
            ...propsData.chartData,
        };
        await wrapper.setProps({
            ...propsData,
            chartData: newChartData
        });

        await nextTick();

        const renderedConfig = vm.chartOptions;
        const tooltipLabelCallback = renderedConfig.tooltips.callbacks.label;

        //tooltipItem.datasetIndex is undefined
        let renderedLabel = tooltipLabelCallback({yLabel: 2}, newChartData);
        expect(renderedLabel).toBe("Value 2");

        //data.datasets is undefined
        renderedLabel = tooltipLabelCallback({datasetIndex: 0, yLabel: 2}, {});
        expect(renderedLabel).toBe("Value 2");

        //tooltip.yLabel is undefined - returns dataseries label
        renderedLabel = tooltipLabelCallback({datasetIndex: 0}, newChartData);
        expect(renderedLabel).toBe("dataset1: ");
    });

    it("tooltip label callback renders uncertainty ranges if given showErrors prop", async () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const newChartData = {
            ...propsData.chartData,
        };
        await wrapper.setProps({
            ...propsData,
            chartData: newChartData,
            showErrors: true
        });

        await nextTick();

        const renderedConfig = vm.chartOptions;
        const tooltipLabelCallback = renderedConfig.tooltips.callbacks.label;

        let renderedLabel = tooltipLabelCallback({ datasetIndex: 0, yLabel: 2, xLabel: "group2" }, propsData.chartData);
        expect(renderedLabel).toBe("dataset1: Value 2 (Value 1.9 - Value 2.1)");
    });

    it("tooltip label callback does not render uncertainty ranges if given showErrors contains null values", async () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const newErrorBars = {
            "group1": { plus: null, minus: null },
            "group2": { plus: null, minus: null }
        }

        const newChartData = {
            ...propsData.chartData,
        };
        newChartData.datasets[0].errorBars = newErrorBars

        await wrapper.setProps({
            ...propsData,
            chartData: newChartData,
            showErrors: true
        });

        await nextTick();

        const renderedConfig = vm.chartOptions;
        const tooltipLabelCallback = renderedConfig.tooltips.callbacks.label;

        let renderedLabel = tooltipLabelCallback({ datasetIndex: 0, yLabel: 2, xLabel: "group2" }, propsData.chartData);
        expect(renderedLabel).toBe("dataset1: Value 2");
    });

    it("hide error bars during animations works as expected", async () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any
        vm.hideErrorBarsDuringAnimation();
        expect(vm.displayErrorBars).toBe(false);
        await new Promise(r => setTimeout(r, 1050));
        expect(vm.displayErrorBars).toBe(true);
    });

    it("clears timeout when hide error bars is called twice", async () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any

        const spy = jest.spyOn(window, "clearTimeout");

        vm.hideErrorBarsDuringAnimation();
        // mount already creates a timeout
        expect(spy).toBeCalledTimes(1);
        
        vm.hideErrorBarsDuringAnimation();
        expect(spy).toBeCalledTimes(2);
    });

    it("hide error bars gets called on mount, chartData and showLabelErrorBars change", async () => {
        const mockHideErrorBars = jest.fn();
        BarChartWithErrors.methods!.hideErrorBarsDuringAnimation = mockHideErrorBars;

        const wrapper = shallowMount(BarChartWithErrors, {props: propsData});
        const vm = wrapper.vm as any

        expect(mockHideErrorBars).toHaveBeenCalledTimes(1);

        vm.$options.watch.chartData.handler.call(vm);
        expect(mockHideErrorBars).toHaveBeenCalledTimes(2);

        vm.$options.watch.showLabelErrorBars.handler.call(vm);
        expect(mockHideErrorBars).toHaveBeenCalledTimes(3);
    });

    it("chart dataset label watcher resets show label error bars", async () => {
        const propsDataMultiple = {
            xLabel: "X Axis",
            yLabel: "Y Axis",
            yFormat: formatFunc,
            chartData: {
                labels: ["group1", "group2"],
                datasets:[
                    {
                        label: "dataset1",
                        backgroundColor: "#111111",
                        data: [1,2],
                        errorBars
                    },
                    {
                        label: "dataset2",
                        backgroundColor: "#111111",
                        data: [3,4],
                        errorBars
                    }
                ]
            },
            showErrorBars: true
        } as any;

        const wrapper = shallowMount(BarChartWithErrors, {props: propsDataMultiple});
        const vm = wrapper.vm as any

        expect(vm.showLabelErrorBars).toStrictEqual([true, true]);
        vm.showLabelErrorBars = [false, true];
        expect(vm.showLabelErrorBars).toStrictEqual([false, true]);

        vm.$options.watch.chartDatasetLabels.handler.call(vm);
        expect(vm.showLabelErrorBars).toStrictEqual([true, true]);
    });

    it("custom legend click function works as expected", async () => {
        const propsDataMultiple = {
            xLabel: "X Axis",
            yLabel: "Y Axis",
            yFormat: formatFunc,
            chartData: {
                labels: ["group1", "group2"],
                datasets:[
                    {
                        label: "dataset1",
                        backgroundColor: "#111111",
                        data: [1,2],
                        errorBars
                    },
                    {
                        label: "dataset2",
                        backgroundColor: "#111111",
                        data: [3,4],
                        errorBars
                    }
                ]
            },
            showErrorBars: true
        } as any;
        const mockHide = jest.fn();
        const mockShow = jest.fn();

        const wrapper = shallowMount(BarChartWithErrors, {props: propsDataMultiple});
        const vm = wrapper.vm as any

        const getLegendAndItem = (index: number, isVisible: boolean) => {
            return {
                legendItem: {
                    datasetIndex: index,
                    hidden: !isVisible
                },
                legend: {
                    chart: {
                        isDatasetVisible: (_: any) => isVisible,
                        hide: mockHide,
                        show: mockShow
                    }
                }
            }
        };

        const { legendItem, legend } = getLegendAndItem(1, true);
        vm.customLegendClick(null, legendItem, legend);
        expect(legendItem.hidden).toBe(true);
        expect(vm.showLabelErrorBars).toStrictEqual([true, false]);
        expect(mockHide).toBeCalledTimes(0);
        expect(mockShow).toBeCalledTimes(0);
        await new Promise(r => setTimeout(r, 50));
        expect(mockHide).toBeCalledTimes(1);
        expect(mockShow).toBeCalledTimes(0);

        jest.resetAllMocks();

        const { legendItem: legendItem1, legend: legend1 } = getLegendAndItem(1, false);
        vm.customLegendClick(null, legendItem1, legend1);
        expect(legendItem1.hidden).toBe(false);
        expect(vm.showLabelErrorBars).toStrictEqual([true, true]);
        expect(mockHide).toBeCalledTimes(0);
        expect(mockShow).toBeCalledTimes(0);
        await new Promise(r => setTimeout(r, 50));
        expect(mockHide).toBeCalledTimes(0);
        expect(mockShow).toBeCalledTimes(1);
    });
});