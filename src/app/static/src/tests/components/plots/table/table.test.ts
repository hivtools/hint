import {createLocalVue, shallowMount, mount} from "@vue/test-utils";
import Table from "../../../../app/components/plots/table/Table.vue";
import MapControl from "../../../../app/components/plots/MapControl.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import {prev, testData, expectFilter} from "../testHelpers";
import Filters from "../../../../app/components/plots/Filters.vue";
import {ColourScaleType} from "../../../../app/store/plottingSelections/plottingSelections";
import Vue from "vue";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const propsData = {
    ...testData,
    selections: {
        indicatorId: "prevalence",
        detail: 4,
        selectedFilterOptions: {
            age: [{id: "0:15", label: "0-15"}],
            sex: [{id: "female", label: "Female"}],
            area: []
        }
    },
    includeFilters: true,
    colourScales: {
        prevalence: {
            type: ColourScaleType.Custom,
            customMin: 1,
            customMax: 2
        }
    }
};

const allAreaIds = ["MWI", "MWI_3_1", "MWI_3_2", "MWI_4_1", "MWI_4_2"];

const getWrapper = (customPropsData: any = {}) => {
    return shallowMount(Table, {propsData: {...propsData, ...customPropsData}, localVue});
};

describe("Table component", () => {
    it("renders table as expected", () => {
        const wrapper = getWrapper();
        expect(wrapper.find(MapControl).props().initialDetail).toEqual(4);
    });
});

// describe('Table Component unit test: ', () => {
//     test('is a Vue instance', () => {
//         const wrapper = mount(Table, {
//             propsData
//         });
//         expect(wrapper.isVueInstance()).toBeTruthy()
//     });
// });


// describe('Table Component', () => {
//     test('is a Vue instance', () => {
//       const wrapper = shallowMount(Table)
//       expect(wrapper.isVueInstance()).toBeTruthy()
//     })
//   })