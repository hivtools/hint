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
}

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
        expect(age.attributes("isxaxis")).toBeUndefined()
        expect(age.attributes("isdisaggregateby")).toBe("true");

        const chart = wrapper.find("#chart chartjs-bar-stub");
        expect(chart.attributes("xlabel")).toBe("Region");
        expect(chart.attributes("ylabel")).toBe("ART coverage");
    });
});