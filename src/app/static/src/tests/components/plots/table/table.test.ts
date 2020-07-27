import {createLocalVue, shallowMount} from "@vue/test-utils";
import Table from "../../../../app/components/plots/table/Table.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";
import {testData} from "../testHelpers";

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
        },
    },
    indicators: [{indicator: "prevalence", "value_column": "prevalence", "indicator_column": "", "indicator_value": "", "name": "HIV prevalence", "min": 0, "max": 0.5, "colour": "interpolateMagma", "invert_scale": true }],
    tabledata: [
        ...testData.chartdata,
        {
            area_id: "MWI_4_1", plhiv: 20, prevalence: 0.8, age: "15:30", sex: "female"
        },
        {
            area_id: "MWI_4_2", plhiv: 20, prevalence: 0.3, age: "0:15", sex: "female"
        }
    ],
}

const getWrapper = (customPropsData: any = {}) => {
    return shallowMount(Table, {propsData: {...propsData, ...customPropsData}, localVue});
};

describe('Table from testdata', () => {
    it('renders a table', () => {
        const wrapper = getWrapper();
        expect(wrapper.contains('div')).toBe(true);
        expect(wrapper.contains('table')).toBe(true);
        expect(wrapper.contains('br')).toBe(true);
    });
    it('renders correct markup', () => {
        const wrapper = getWrapper();
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('4.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.1');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when male selected', () => {
        const wrapper = getWrapper({ selections: {
            ...propsData.selections,
            selectedFilterOptions: {
                ...propsData.selections.selectedFilterOptions,
                sex: [{id: "male", label: "Male"}]
            }
        }
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('4.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Male');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.1');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when detail set to 3', () => {
        const wrapper = getWrapper({ selections: {
            ...propsData.selections,
            detail: 3,
        } });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.01');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when age set to 15-30', () => {
        const wrapper = getWrapper({ selections: {
            ...propsData.selections,
            selectedFilterOptions: {
                ...propsData.selections.selectedFilterOptions,
                age: [{id: "15:30", label: "15-30"}]
            }
        }
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('4.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('15-30');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.8');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when no data are available for selected filters', () => {
        const wrapper = getWrapper({ selections: {
            ...propsData.selections,
            selectedFilterOptions: {
                age: [{id: "15:30", label: "15-30"}],
                sex: [{id: "male", label: "Male"}],
                area: []
            }
        }
        });
        expect(wrapper.contains('table')).toBe(false);
        expect(wrapper.text()).toContain('No data are available for these selections.')
    });
    it('renders correct markup when plhiv indicator is selected', () => {
        const wrapper = getWrapper({ 
            selections: {
                ...propsData.selections,
                indicatorId: "plhiv"
            },
            indicators: [{
                ...propsData.indicators,
                indicator: "plhiv", value_column: "plhiv", name: "PLHIV" }]
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('4.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('PLHIV');
        expect(wrapper.findAll('td').at(3).text()).toBe('10');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when 3.2 is selected only', () => {
        const wrapper = getWrapper({ selections: {
            ...propsData.selections,
            selectedFilterOptions: {
                ...propsData.selections.selectedFilterOptions,
                area: [ { "id": "MWI_3_2", "label": "3.2", "children": [ { "id": "MWI_4_2", "label": "4.2", "children": [] }] }]
            }
        },
        filters: [
            {
                ...propsData.filters[0],
                options: [
                    { "id": "MWI_3_1", "label": "3.1", "children": [ { "id": "MWI_4_1", "label": "4.1", "children": [] }] },
                    { "id": "MWI_3_2", "label": "3.2", "children": [ { "id": "MWI_4_2", "label": "4.2", "children": [] }] }
                ]
            },
            {...propsData.filters[1]},
            {...propsData.filters[2]}
        ]
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('4.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.3');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when 3.2 is selected only and detail is set to 3', () => {
        const wrapper = getWrapper({ selections: {
            ...propsData.selections,
            detail: 3,
            selectedFilterOptions: {
                ...propsData.selections.selectedFilterOptions,
                area: [ { "id": "MWI_3_2", "label": "3.2", "children": [ { "id": "MWI_4_2", "label": "4.2", "children": [] }] }]
            }
        },
        filters: [
            {
                ...propsData.filters[0],
                options: [
                    { "id": "MWI_3_1", "label": "3.1", "children": [ { "id": "MWI_4_1", "label": "4.1", "children": [] }] },
                    { "id": "MWI_3_2", "label": "3.2", "children": [ { "id": "MWI_4_2", "label": "4.2", "children": [] }] }
                ]
            },
            {...propsData.filters[1]},
            {...propsData.filters[2]}
        ]
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('3.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
})
