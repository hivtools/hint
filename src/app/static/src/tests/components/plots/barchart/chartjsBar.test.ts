import ChartjsBar from "../../../../app/components/plots/barchart/chartjsBar.vue";
import {createLocalVue, shallowMount} from "@vue/test-utils";
import Vue from "vue";
import Vuex from "vuex";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("chartjsBar component", () => {

    const propsData = {
        xLabel: "X Axis",
        yLabel: "Y Axis",
        chartdata: {
            labels: ["group1", "group2"],
            datasets:[
                {
                    label: "dataset1",
                    backgroundColor: "#111111",
                    data: [1,2],
                    errorBars: {
                        "group1": {plus: 1.1, minus: 0.9},
                        "group2": {plus: 2.1, minus: 1.9}
                    }
                }
            ]
        }
    };

    it("renders as expected", () => {
        const wrapper = shallowMount(ChartjsBar, {propsData, localVue});
        expect(wrapper.findAll("canvas").length).toEqual(1);
        console.log(wrapper.html());
    });

    it("updates render when props chartdata changes", () => {
        const wrapper = shallowMount(ChartjsBar, {propsData, localVue});

        const mockUpdate = jest.fn();
        const vm = (wrapper as any).vm;
        vm.updateRender = mockUpdate;

        const newChartData = {
            ...propsData.chartdata,
            labels: ["group1"]
        };
        wrapper.setProps({
            ...propsData,
            chartdata: newChartData
        });

        expect(mockUpdate.mock.calls.length).toBe(1);

    });
});