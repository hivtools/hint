import Filters from "../../../app/components/plots/Filters.vue";
import {createLocalVue, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectFilter, testData} from "./testHelpers";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const propsData = {
    filters: testData.filters,
    selectedFilterOptions: {
            age: [{id: "0:15", label:"0-15"}],
            sex: [{id: "female", label:"Female"}],
            area: []
        },
    selectMultipleFilterIds: ["area"]
};

const getWrapper  = (customPropsData: any = {}) => {
    return shallowMount(Filters, {propsData: {...propsData, ...customPropsData}, localVue});
};

describe("Filters component", () => {
    it("renders multiple values filter", () => {
        const wrapper = getWrapper();
        expectFilter(wrapper, "filter-area", [], "Area", true,[{id: "MWI", label: "Malawi", children: [
                {id: "MWI_3_1", label: "3.1"},
                {id: "MWI_4_1", label: "4.1"},
                {id: "MWI_4_2", label: "4.2"},
                {id: "MWI_4_3", label: "4.3"}
            ] } as any
        ]);
    });

    it("renders single value filters", () => {
        const wrapper = getWrapper();

        expectFilter(wrapper, "filter-age", ["0:15"], "Age", false,
            [{id: "0:15", label:"0-15"}, {id: "15:30", label: "15-30"}]);
        expectFilter(wrapper, "filter-sex", ["female"], "Sex", false,
            [{id: "female", label:"Female"}, {id: "male", label: "Male"}]);
    });

    it("can getSelectedFilterValues", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).getSelectedFilterValues("age")).toStrictEqual(["0:15"]);
    });

    it("onFilterSelect updates filter value", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onFilterSelect(propsData.filters[1], [{id: "15:30", label: "15-30"}]);
        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
                ...propsData.selectedFilterOptions,
                age: [{id: "15:30", label:"15-30"}],
            });
    });
});