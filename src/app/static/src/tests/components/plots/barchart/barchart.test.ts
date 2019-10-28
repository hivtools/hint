import {createLocalVue, shallowMount, Wrapper} from "@vue/test-utils";
import {data, filters} from "./utils.test"
import Barchart from "../../../../app/components/plots/barchart/Barchart.vue"

const localVue = createLocalVue();

const propsData = {
  chartdata: data,
  filters,
  indicators: [
      {
          indicator: "art_cov",
          value_column: "mean",
          indicator_column: "indicator",
          indicator_value: "2",
          name: "ART coverage",
          error_low_column: "low",
          error_high_column: "high"
      },
      {
          indicator: "prevalence",
          value_column: "mean",
          indicator_column: "indicator",
          indicator_value: "3",
          name: "Prevalence",
          error_low_column: "low",
          error_high_column: "high"
      }
  ]
};

const getWrapper  = () => {
  return shallowMount(Barchart, {propsData, localVue});
};

const confirmFormGroup = (wrapper: Wrapper<Barchart>, elementId: string, label: string) => {
    const fg = wrapper.find("#indicator-fg");
    expect(fg.find("label").text()).toBe("Indicator");
    expect(fg.findAll("treeselect-stub").length).toBe(1);
};

describe("Barchart component", () => {
    it("renders as expected", () => {
        const wrapper = getWrapper();

        confirmFormGroup(wrapper, "#indicator-fg", "Indicator");
        confirmFormGroup(wrapper, "#x-axis-fg", "X Axis");
        confirmFormGroup(wrapper, "#disagg-fg", "Disaggregate by");

        const region = wrapper.find("#filter-region filter-select-stub");
        expect(region.attributes("label")).toBe("Region");
        expect(region.attributes("isxaxis")).toBe("true");
        expect(region.attributes("isdisaggregateby")).toBeUndefined();

        const age = wrapper.find("#filter-age filter-select-stub");
        expect(age.attributes("label")).toBe("Age group");
        expect(age.attributes("isxaxis")).toBeUndefined();
        expect(age.attributes("isdisaggregateby")).toBe("true");

        const chart = wrapper.find("#chart chartjs-bar-stub");
        expect(chart.attributes("xlabel")).toBe("Region");
        expect(chart.attributes("ylabel")).toBe("ART coverage");
    });

    it("computes x axis label", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.xAxisLabel;
        expect(result).toBe("Region");

    });

    it("computes x axis labels", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.xAxisLabels;
        expect(result).toStrictEqual(["Northern"]);
    });

    it("computes x axis values", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.xAxisValues;
        expect(result).toStrictEqual(["1"]);
    });

    it("computes bar label lookup", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.barLabelLookup;
        expect(result).toStrictEqual({"0:4": "0-4"});
    });

    it("computes x axis label lookup", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.xAxisLabelLookup;
        expect(result).toStrictEqual({"1": "Northern"});
    });

    it("computes filters as options", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.filtersAsOptions
        expect(result).toStrictEqual([
            {id: "region", label: "Region"},
            {id: "age", label: "Age group"},
            {id: "sex", label: "Sex"}
        ]);
    });

    it("computes indicator", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.indicator;
        expect(result).toBe(propsData.indicators[0]);
    });

    it("computed processedData", () =>{
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;

        const result = vm.processedOutputData;
        expect(result).toStrictEqual({
            labels: ["Northern"],
            datasets: [
                {
                    label: "0-4",
                    backgroundColor: "#e41a1c",
                    data: [0.40],
                    errorBars: {"Northern": {plus: 0.43, minus: 0.38}}
                }
            ]
        });
    });
});