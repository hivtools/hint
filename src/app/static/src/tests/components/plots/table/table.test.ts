import {mount} from "@vue/test-utils";
import Table from "../../../../app/components/plots/table/Table.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {testData} from "../testHelpers";
import {Language} from "../../../../app/store/translations/locales";

const createStore = () => {
    const store = new Vuex.Store({
        state: {language: Language.en}
    });
    registerTranslations(store);
    return store as any;
};

const createStoreFr = () => {
    const store = new Vuex.Store({
        state: {language: Language.fr}
    });
    registerTranslations(store);
    return store as any;
};

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
    indicators: [{
        indicator: "prevalence",
        "value_column": "prevalence",
        "indicator_column": "",
        "indicator_value": "",
        "name": "HIV prevalence",
        "min": 0,
        "max": 0.5,
        "colour": "interpolateMagma",
        "invert_scale": true,
        "format": "0.00%",
        "scale": 1
    }],
    tabledata: [
        ...testData.chartdata,
        {
            area_id: "MWI_4_1", plhiv: 20, prevalence: 0.8, age: "15:30", sex: "female"
        },
        {
            area_id: "MWI_4_2", plhiv: 20, prevalence: 0.3, age: "0:15", sex: "female"
        }
    ],
    countryAreaFilterOption: {
        id: "MWI", label: "Malawi", children: [
            {"id": "MWI_3_1", "label": "3.1", "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]},
            {"id": "MWI_3_2", "label": "3.2", "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]}
        ]
    }
}

const getWrapper = (customPropsData: any = {}) => {
    const store = createStore();
    return mount(Table, {store, propsData: {...propsData, ...customPropsData}});
};

const getWrapperFr = (customPropsData: any = {}) => {
    const store = createStoreFr();
    return mount(Table, {store, propsData: {...propsData, ...customPropsData}});
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
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.1 3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('10.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when male selected', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    sex: [{id: "male", label: "Male"}]
                }
            }
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.2 3.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Male');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('10.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when detail set to 3', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                detail: 3,
            }
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('1.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when no data are available for selected filters', () => {
        const wrapper = getWrapper({
            selections: {
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
                indicator: "plhiv", value_column: "plhiv", name: "PLHIV", format: "0,0", scale: 10
            }]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.1 3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('PLHIV (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('10');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when 3.2 is selected only', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{
                        "id": "MWI_3_2",
                        "label": "3.2",
                        "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                    }]
                }
            },
            filters: [
                {
                    ...propsData.filters[0],
                    options: [
                        {
                            "id": "MWI_3_1",
                            "label": "3.1",
                            "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]
                        },
                        {
                            "id": "MWI_3_2",
                            "label": "3.2",
                            "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                        }
                    ]
                },
                {...propsData.filters[1]},
                {...propsData.filters[2]}
            ]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.2 3.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('30.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when 3.2 is selected only and detail is set to 3', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                detail: 3,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{
                        "id": "MWI_3_2",
                        "label": "3.2",
                        "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                    }]
                }
            },
            filters: [
                {
                    ...propsData.filters[0],
                    options: [
                        {
                            "id": "MWI_3_1",
                            "label": "3.1",
                            "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]
                        },
                        {
                            "id": "MWI_3_2",
                            "label": "3.2",
                            "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                        }
                    ]
                },
                {...propsData.filters[1]},
                {...propsData.filters[2]}
            ]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('3.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('0.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when detail set to 0', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                detail: 0
            },
            tabledata: [
                ...propsData.tabledata,
                {
                    area_id: "MWI", plhiv: 25, prevalence: 0.5, age: "0:15", sex: "female"
                }
            ],
            filters: [
                {
                    ...propsData.filters[0],
                    options: [
                        {
                            id: "MWI", label: "Malawi", children: [
                                {
                                    "id": "MWI_3_1",
                                    "label": "3.1",
                                    "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]
                                },
                                {
                                    "id": "MWI_3_2",
                                    "label": "3.2",
                                    "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                                }
                            ]
                        },
                    ]
                },
                {...propsData.filters[1]},
                {...propsData.filters[2]}
            ]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('Malawi');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('50.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when detail set to null', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                detail: null,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [
                        {
                            id: "MWI", label: "Malawi", children: [
                                {
                                    "id": "MWI_3_1",
                                    "label": "3.1",
                                    "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]
                                },
                                {
                                    "id": "MWI_3_2",
                                    "label": "3.2",
                                    "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                                }
                            ]
                        }
                    ]
                }
            },
            tabledata: [
                ...propsData.tabledata,
                {
                    area_id: "MWI", plhiv: 25, prevalence: 0.5, age: "0:15", sex: "female"
                }
            ],
            filters: [
                {
                    ...propsData.filters[0],
                    options: [
                        {
                            id: "MWI", label: "Malawi", children: [
                                {
                                    "id": "MWI_3_1",
                                    "label": "3.1",
                                    "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]
                                },
                                {
                                    "id": "MWI_3_2",
                                    "label": "3.2",
                                    "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                                }
                            ]
                        },
                    ]
                },
                {...propsData.filters[1]},
                {...propsData.filters[2]}
            ]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('Malawi');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('50.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('renders correct markup when detail set to 0 but 3.2 is selected', () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                detail: 0,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{
                        "id": "MWI_3_2",
                        "label": "3.2",
                        "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                    }]
                }
            },
            tabledata: [
                ...propsData.tabledata,
                {
                    area_id: "MWI", plhiv: 25, prevalence: 0.5, age: "0:15", sex: "female"
                }
            ],
            filters: [
                {
                    ...propsData.filters[0],
                    options: [
                        {
                            id: "MWI", label: "Malawi", children: [
                                {
                                    "id": "MWI_3_1",
                                    "label": "3.1",
                                    "children": [{"id": "MWI_4_1", "label": "4.1", "children": []}]
                                },
                                {
                                    "id": "MWI_3_2",
                                    "label": "3.2",
                                    "children": [{"id": "MWI_4_2", "label": "4.2", "children": []}]
                                }
                            ]
                        },
                    ]
                },
                {...propsData.filters[1]},
                {...propsData.filters[2]}
            ]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('Malawi');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('50.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });

    it('renders correct markup in French', () => {
        const wrapper = getWrapperFr();
        expect(wrapper.find('th').text()).toBe('Zone (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.1 3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Âge (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sexe (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('10.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when sorting by HIV prevalence ascending', () => {
        const wrapper = getWrapper();
        wrapper.setData({sortBy: 'prevalence'})
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.1 3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Descending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('10.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when sorting by HIV prevalence descending', () => {
        const wrapper = getWrapper();
        wrapper.setData({sortBy: 'prevalence', sortDesc: true})
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.2 3.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('30.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
    it('renders correct markup when filtering by 4.2', () => {
        const wrapper = getWrapper();
        wrapper.setData({filter: '4.2'})
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.2 3.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('30.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });
    it('clicking clear button clears filter and resets table', () => {
        const wrapper = getWrapper();
        wrapper.setData({filter: '4.2'})
        wrapper.find('button').trigger('click')
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.1 3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('10.00%');
        expect(wrapper.findAll('tr').length).toBe(3);
    });

    it('renders correct markup when uncertainty ranges are added', () => {
        const wrapper = getWrapper({
            tabledata: [
                {
                    ...propsData.tabledata[0], upper: 100, lower: 0
                },
                {
                    ...propsData.tabledata[1], upper: 0.9, lower: 0.01
                },
                {
                    ...propsData.tabledata[2], upper: 98, lower: 2
                },
                {
                    ...propsData.tabledata[3], upper: 97, lower: 3
                },
                {
                    ...propsData.tabledata[4], upper: 96, lower: 4
                },
                {
                    ...propsData.tabledata[5], upper: 95, lower: 5
                }
            ],
            indicators: [{...propsData.indicators[0], error_low_column: "lower", error_high_column: "upper"}]
        });
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.1 3.1');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('0-15');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Female');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).find("div").text()).toBe('10.00%');
        expect(wrapper.findAll('td').at(3).find(".small").text()).toBe('(1.00% – 90.00%)');
        expect(wrapper.findAll('tr').length).toBe(3);
    });
})
