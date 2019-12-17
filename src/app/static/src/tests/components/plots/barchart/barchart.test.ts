import {createLocalVue, shallowMount, Wrapper} from "@vue/test-utils";
import Vuex from "vuex";
import {data, filters} from "./utils.test";
import Barchart from "../../../../app/components/plots/barchart/Barchart.vue";
import Vue from 'vue';
import {emptyState} from "../../../../app/root";
import registerTranslations from "../../../../app/store/translations/registerTranslations";

const localVue = createLocalVue();

const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

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
  ],
  selections: {
      indicatorId: "art_cov",
      xAxisId: "region",
      disaggregateById: "age",
      selectedFilterOptions: {
          region: [{id: "1", label: "Northern"}],
          age: [{id: "0:4", label: "0-4"}],
          sex: [{id: "female", label: "female"}]
      }
  }
};

const uninitializedSelections = {
    indicatorId: "",
    xAxisId: "",
    disaggregateById: "",
    selectedFilterOptions: {}
};

const getWrapper  = () => {
  return shallowMount(Barchart, {propsData, localVue, store});
};

const confirmFormGroup = (wrapper: Wrapper<Barchart>, elementId: string, label: string) => {
    const fg = wrapper.find(elementId);
    expect(fg.find("label").text()).toBe(label);
    expect(fg.findAll("treeselect-stub").length).toBe(1);
};

describe("Barchart component", () => {
    it("renders as expected", () => {
        const wrapper = getWrapper();

        expect(wrapper.find("h3").text()).toBe("Filters");

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

    it("computes initialised", () => {
       let wrapper = getWrapper();
       let vm = (wrapper as any).vm;
       expect(vm.initialised).toBe(true);

       const props = {
           ...propsData,
           selections: uninitializedSelections
       };
       wrapper = shallowMount(Barchart, {propsData: props, localVue});
       vm = (wrapper as any).vm;
       expect(vm.initialised).toBe(false);
    });

    it("does not render controls when not initialised", () => {
        const props = {
            ...propsData,
            selections: uninitializedSelections
        };
        const wrapper = shallowMount(Barchart, {propsData: props, localVue});

        expect(wrapper.findAll(".form-group").length).toBe(0);
        expect(wrapper.findAll("#chart").length).toBe(0);
    });

    it("initialises selections on create", () => {
        const props = {
            ...propsData,
            selections: uninitializedSelections
        };
        const wrapper = shallowMount(Barchart, {propsData: props, localVue});

        Vue.nextTick();
        expect(wrapper.emitted()["update"].length).toBe(4);

        expect(wrapper.emitted()["update"][0][0]).toStrictEqual({indicatorId: "art_cov"});
        expect(wrapper.emitted()["update"][1][0]).toStrictEqual({xAxisId: "region"});
        expect(wrapper.emitted()["update"][2][0]).toStrictEqual({disaggregateById: "age"});
        expect(wrapper.emitted()["update"][3][0]).toStrictEqual({selectedFilterOptions: {
                region: [{id: "1", label: "Northern"}],
                age: [{id: "0:4", label: "0-4"}],
                sex: [{id: "female", label: "female"}]
            }});
    });

    it("normalizeIndicators returns expected result", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        const result = vm.normalizeIndicators(propsData.indicators[0]);
        expect(result).toStrictEqual({id: "art_cov", label: "ART coverage"});
    });

    it("setting indicatorId emits changed-selections event with new data", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.indicatorId = "newIndicatorId";

        expect(wrapper.emitted()["update"].length).toBe(1);
        const expected = {indicatorId: "newIndicatorId"};
        expect(wrapper.emitted()["update"][0][0]).toStrictEqual(expected);
    });

    it("csetting xAxisId emits update event with new data", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.xAxisId ="newXAxisId";

        expect(wrapper.emitted()["update"].length).toBe(1);
        const expected = {xAxisId: "newXAxisId"};
        expect(wrapper.emitted()["update"][0][0]).toStrictEqual(expected);
    });

    it("setting disaggregateById emits update event with new data", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.disaggregateById = "newDisaggById";

        expect(wrapper.emitted()["update"].length).toBe(1);
        const expected = {disaggregateById: "newDisaggById"};
        expect(wrapper.emitted()["update"][0][0]).toStrictEqual(expected);
    });

    it("changeFilter emits update event with new data", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        vm.changeFilter("age", [{id: "newAgeId", label: "newAgeLabel"}]);

        expect(wrapper.emitted()["update"].length).toBe(1);

        const expectedSelectedFilterOptions = {...propsData.selections.selectedFilterOptions,
            age: [{id: "newAgeId", label: "newAgeLabel"}]};

        const expected = {...propsData.selections, selectedFilterOptions: expectedSelectedFilterOptions};
        expect(wrapper.emitted()["update"][0][0]).toStrictEqual(expected);
    });
});