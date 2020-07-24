import {createLocalVue, shallowMount} from "@vue/test-utils";
import Table from "../../../../app/components/plots/table/Table.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {emptyState} from "../../../../app/root";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const propsData = {
    selections: {
        indicatorId: "prevalence",
        detail: 4,
        selectedFilterOptions: {
            age: [{id: "0:15", label: "0-15"}],
            sex: [{id: "female", label: "Female"}],
            area: []
        },
    },
    selectedFilterOptions: {
        age: [{id: "0:15", label: "0-15"}],
        sex: [{id: "female", label: "Female"}],
        area: []
    },
    areaFilterId: "area",
    indicators: [{indicator: "prevalence", "value_column": "prevalence", "indicator_column": "", "indicator_value": "", "name": "HIV prevalence", "min": 0, "max": 0.5, "colour": "interpolateMagma", "invert_scale": true }],
    filters: [
        {
            id: "area", label: "Area", column_id: "area_id",
            options: [{
                id: "MWI", label: "Malawi", children: [
                    {id: "MWI_3_1", label: "Area 1"},
                    {id: "MWI_3_2", label: "Area 2"},
                    {id: "MWI_4_1", label: "City A"},
                    {id: "MWI_4_2", label: "City B"}
                ]
            }
            ]
        },
        {
            id: "age",
            label: "Age",
            column_id: "age",
            options: [{id: "0:15", label: "0-15"}, {id: "15:30", label: "15-30"}]
        },
        {
            id: "sex",
            label: "Sex",
            column_id: "sex",
            options: [{id: "female", label: "Female"}, {id: "male", label: "Male"}]
        }
    ],
    tabledata: [
        {
            area_id: "MWI_3_1", plhiv: 1, prevalence: 0.01, age: "0:15", sex: "female"
        },
        {
            area_id: "MWI_4_1", plhiv: 10, prevalence: 0.1, age: "0:15", sex: "female"
        },
        {
            area_id: "MWI_4_2", plhiv: 20, prevalence: 0.2, age: "0:15", sex: "female"
        },
        {
            area_id: "MWI_3_2", plhiv: 20, prevalence: 0, age: "0:15", sex: "female"
        },
        {
            area_id: "MWI_4_2", plhiv: 20, prevalence: 0.1, age: "0:15", sex: "male"
        },
        {
            area_id: "MWI_4_1", plhiv: 20, prevalence: 0.9, age: "0:15", sex: "male"
        },
        {
            area_id: "MWI_4_1", plhiv: 20, prevalence: 0.8, age: "16:65", sex: "female"
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
        expect(wrapper.find('td').text()).toBe('City A');
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
            indicatorId: "prevalence",
            detail: 4,
            selectedFilterOptions: {
                age: [{id: "0:15", label: "0-15"}],
                sex: [{id: "male", label: "Male"}],
                area: []
            },
        },
        selectedFilterOptions: {
            age: [{id: "0:15", label: "0-15"}],
            sex: [{id: "male", label: "Male"}],
            area: []
        } });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('City B');
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
            indicatorId: "prevalence",
            detail: 3,
            selectedFilterOptions: {...propsData.selections.selectedFilterOptions}
        } });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('Area 1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.01');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when age set to 16-65', () => {
        const wrapper = getWrapper({ selections: {
            indicatorId: "prevalence",
            detail: 4,
            selectedFilterOptions: {
                age: [{id: "16:65", label: "16-65"}],
                sex: [{id: "female", label: "Female"}],
                area: []
            },
        },
        selectedFilterOptions: {
            age: [{id: "16:65", label: "16-65"}],
            sex: [{id: "female", label: "Female"}],
            area: []
        } });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('City A');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('16-65');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.8');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when no data are available for selected filters', () => {
        const wrapper = getWrapper({ selections: {
            indicatorId: "prevalence",
            detail: 4,
            selectedFilterOptions: {
                age: [{id: "16:65", label: "16-65"}],
                sex: [{id: "male", label: "Male"}],
                area: []
            },
        },
        selectedFilterOptions: {
            age: [{id: "16:65", label: "16-65"}],
            sex: [{id: "male", label: "Male"}],
            area: []
        } });
        expect(wrapper.contains('table')).toBe(false);
        expect(wrapper.text()).toContain('No data are available for these selections.')
    });
    it('renders correct markup when plhiv indicator is selected', () => {
        const wrapper = getWrapper({ 
            selections: {
                indicatorId: "plhiv",
                detail: 4,
                selectedFilterOptions: {...propsData.selections.selectedFilterOptions}
            },
            indicators: [{indicator: "plhiv", "value_column": "plhiv", "indicator_column": "", "indicator_value": "", "name": "PLHIV", "min": 0, "max": 0.5, "colour": "interpolateMagma", "invert_scale": true }]
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('City A');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('PLHIV');
        expect(wrapper.findAll('td').at(3).text()).toBe('10');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when area 2 is selected only', () => {
        const wrapper = getWrapper({ selections: {
            indicatorId: "prevalence",
            detail: 4,
            selectedFilterOptions: {
                age: [{id: "0:15", label: "0-15"}],
                sex: [{id: "female", label: "Female"}],
                area: [ { "id": "MWI_3_2", "label": "Area 2", "children": [ { "id": "MWI_4_2", "label": "City B", "children": [] }] }]
            },
        },
        selectedFilterOptions: {
            age: [{id: "0:15", label: "0-15"}],
            sex: [{id: "female", label: "Female"}],
            area: [ { "id": "MWI_3_2", "label": "Area 2", "children": [ { "id": "MWI_4_2", "label": "City B", "children": [] }] }]
        }, 
        filters: [
            {
                id: "area", label: "Area", column_id: "area_id",
                options: [
                    { "id": "MWI_3_1", "label": "Area 1", "children": [ { "id": "MWI_4_1", "label": "City A", "children": [] }] },
                    { "id": "MWI_3_2", "label": "Area 2", "children": [ { "id": "MWI_4_2", "label": "City B", "children": [] }] }
                ]
            },
            {...propsData.filters[1]},
            {...propsData.filters[2]}
        ]
        });
        expect(wrapper.find('th').text()).toBe('Area');
        expect(wrapper.find('td').text()).toBe('City B');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.3');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
})
