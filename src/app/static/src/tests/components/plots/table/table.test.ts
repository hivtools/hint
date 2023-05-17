import {mount, VueWrapper} from "@vue/test-utils";
import Table from "../../../../app/components/plots/table/Table.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import {Language} from "../../../../app/store/translations/locales";

const createStore = () => {
    const store = new Vuex.Store({
        state: {language: Language.en, updatingLanguage: false}
    });
    registerTranslations(store);
    return store as any;
};

const createStoreFr = () => {
    const store = new Vuex.Store({
        state: {language: Language.fr, updatingLanguage: false}
    });
    registerTranslations(store);
    return store as any;
};

const props = {
    filteredData: [
        {
            area_id: "4.1", plhiv: 20, prevalence: "80.00%", age: "0-15", sex: "Female"
        },
        {
            area_id: "4.2", plhiv: 20, prevalence: "30.00%", age: "15-30", sex: "Male"
        }
    ],
    fields: [
        {key: "area_id", label: "Area", sortable: true, sortByFormatted: true},
        {key: "age",  label: "Age", sortable: true, sortByFormatted: true},
        {key: "sex", label: "Sex", sortable: true, sortByFormatted: true},
        {key: "prevalence", label: "HIV prevalence", sortable: true, sortByFormatted: true}
    ]
};

const getWrapper = (customPropsData: any = {}) => {
    const store = createStore();
    return mount(Table, {store, props: {...props, ...customPropsData}});
};

const getWrapperFr = (customPropsData: any = {}) => {
    const store = createStoreFr();
    return mount(Table, {store, props: {...props, ...customPropsData}});
};

describe('Table from testdata', () => {

    const expectDefaultTableMarkup = (wrapper: VueWrapper) => {
        const dataRow1 = wrapper.findAllComponents("tr")[1];
        const dataRow2 = wrapper.findAllComponents("tr")[2];

        expect(wrapper.findComponent('th').text()).toBe('Area (Click to sort Ascending)');
        expect(dataRow1.findComponent('td').text()).toBe('4.1');
        expect(dataRow2.findComponent('td').text()).toBe('4.2');

        expect(wrapper.findAllComponents('th')[1].text()).toBe('Age (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[1].text()).toBe('0-15');
        expect(dataRow2.findAllComponents('td')[1].text()).toBe('15-30');

        expect(wrapper.findAllComponents('th')[2].text()).toBe('Sex (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[2].text()).toBe('Female');
        expect(dataRow2.findAllComponents('td')[2].text()).toBe('Male');

        expect(wrapper.findAllComponents('th')[3].text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[3].text()).toBe('80.00%');
        expect(dataRow2.findAllComponents('td')[3].text()).toBe('30.00%');

        expect(wrapper.findAllComponents('tr').length).toBe(3);
    };

    it('renders a table', () => {
        const wrapper = getWrapper();
        expect(wrapper.contains('div')).toBe(true);
        expect(wrapper.contains('table')).toBe(true);
        expect(wrapper.contains('br')).toBe(true);
    });

    it('renders correct markup', () => {
        const wrapper = getWrapper();
        expectDefaultTableMarkup(wrapper);
    });

    it('renders correct markup when no data are available for selected filters', () => {
        const wrapper = getWrapper({
            filteredData: []
        });
        expect(wrapper.contains('table')).toBe(false);
        expect(wrapper.text()).toContain('No data are available for these selections.')
    });

    it('renders correct markup when no data are available for selected filters in French', () => {
        const wrapper = getWrapperFr({
            filteredData: []
        });
        expect(wrapper.contains('table')).toBe(false);
        expect(wrapper.text()).toContain("Aucune donnée n'est disponible pour ces sélections.")
    });

    it('renders correct markup when sorting by HIV prevalence ascending', () => {
        const wrapper = getWrapper();
        wrapper.setData({sortBy: 'prevalence'});

        const dataRow1 = wrapper.findAllComponents("tr")[1];
        const dataRow2 = wrapper.findAllComponents("tr")[2];

        expect(wrapper.findComponent('th').text()).toBe('Area (Click to sort Ascending)');
        expect(dataRow1.findComponent('td').text()).toBe('4.2');
        expect(dataRow2.findComponent('td').text()).toBe('4.1');

        expect(wrapper.findAllComponents('th')[1].text()).toBe('Age (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[1].text()).toBe('15-30');
        expect(dataRow2.findAllComponents('td')[1].text()).toBe('0-15');


        expect(wrapper.findAllComponents('th')[2].text()).toBe('Sex (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[2].text()).toBe('Male');
        expect(dataRow2.findAllComponents('td')[2].text()).toBe('Female');


        expect(wrapper.findAllComponents('th')[3].text()).toBe('HIV prevalence (Click to sort Descending)');
        expect(dataRow1.findAllComponents('td')[3].text()).toBe('30.00%');
        expect(dataRow2.findAllComponents('td')[3].text()).toBe('80.00%');

        expect(wrapper.findAllComponents('tr').length).toBe(3);

    });

    it('renders correct markup when sorting by HIV prevalence descending', () => {
        const wrapper = getWrapper();
        wrapper.setData({sortBy: 'prevalence', sortDesc: true});
        expectDefaultTableMarkup(wrapper);
    });

    it('renders correct markup when filtering by 4.2', () => {
        const wrapper = getWrapper();
        wrapper.setData({filter: '4.2'})
        expect(wrapper.findComponent('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.findComponent('td').text()).toBe('4.2');
        expect(wrapper.findAllComponents('th')[1].text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAllComponents('td')[1].text()).toBe('15-30');
        expect(wrapper.findAllComponents('th')[2].text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAllComponents('td')[2].text()).toBe('Male');
        expect(wrapper.findAllComponents('th')[3].text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAllComponents('td')[3].text()).toBe('30.00%');
        expect(wrapper.findAllComponents('tr').length).toBe(2);
    });

    it('clicking clear button clears filter and resets table', async () => {
        const wrapper = getWrapper();
        wrapper.setData({filter: '4.2'})
        wrapper.findComponent('button').trigger('click')
        expectDefaultTableMarkup(wrapper);
    });

    it("scoped slot content is rendered correctly", () => {
        const store = createStore();
        const scopedSlots = {
            "cell(area_id)": `<template v-slot:cell(area_id)="props">
                    <div class="value">{{ props.item.area_id }}</div>
                    <div class="small">{{ props.item.area_hierarchy }}</div>
                </template>`,
            "cell(prevalence)": `<template v-slot:cell(prevalence)="props">
                                     <div class="value">{{ props.item.prevalence }}</div>
                                     <div class="small">({{ props.item.prevalence_lower }} - {{ props.item.prevalence_upper }})</div>
                                  </template>`
        } ;

        const filteredDataWithSlotValues = [
            {
                area_id: "4.1",
                area_hierarchy: "3.1",
                plhiv: 20,
                prevalence: "80.00%",
                prevalence_lower: "70.00%",
                prevalence_upper: "90.00%",
                age: "0-15",
                sex: "Female"
            },
            {
                area_id: "4.2",
                area_hierarchy: "3.2",
                plhiv: 20,
                prevalence: "30.00%",
                prevalence_lower: "20.00%",
                prevalence_upper: "40.00%",
                age: "15-30",
                sex: "Male"
            }
        ];


        const customPropsData = {...props, filteredData: filteredDataWithSlotValues};

        const wrapper = mount(Table, {store, props: customPropsData, scopedSlots});

        const dataRow1 = wrapper.findAllComponents("tr")[1];
        const dataRow2 = wrapper.findAllComponents("tr")[2];

        expect(wrapper.findComponent('th').text()).toBe('Area (Click to sort Ascending)');
        expect(dataRow1.findComponent('td .value').text()).toBe('4.1');
        expect(dataRow1.findComponent('td .small').text()).toBe('3.1');
        expect(dataRow2.findComponent('td .value').text()).toBe('4.2');
        expect(dataRow2.findComponent('td .small').text()).toBe('3.2');

        expect(wrapper.findAllComponents('th')[1].text()).toBe('Age (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[1].text()).toBe('0-15');
        expect(dataRow2.findAllComponents('td')[1].text()).toBe('15-30');

        expect(wrapper.findAllComponents('th')[2].text()).toBe('Sex (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[2].text()).toBe('Female');
        expect(dataRow2.findAllComponents('td')[2].text()).toBe('Male');

        expect(wrapper.findAllComponents('th')[3].text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(dataRow1.findAllComponents('td')[3].findComponent(".value").text()).toBe('80.00%');
        expect(dataRow1.findAllComponents('td')[3].findComponent(".small").text()).toBe('(70.00% - 90.00%)');
        expect(dataRow2.findAllComponents('td')[3].findComponent(".value").text()).toBe('30.00%');
        expect(dataRow2.findAllComponents('td')[3].findComponent(".small").text()).toBe('(20.00% - 40.00%)');

        expect(wrapper.findAllComponents('tr').length).toBe(3);
    });

});
