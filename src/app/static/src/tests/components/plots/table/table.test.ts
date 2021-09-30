import {mount, Wrapper} from "@vue/test-utils";
import Table from "../../../../app/components/plots/table/Table.vue";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";;
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
    return mount(Table, {store, propsData: {...propsData, ...customPropsData}});
};

const getWrapperFr = (customPropsData: any = {}) => {
    const store = createStoreFr();
    return mount(Table, {store, propsData: {...propsData, ...customPropsData}});
};

describe('Table from testdata', () => {

    const expectDefaultTableMarkup = (wrapper: Wrapper<any>) => {
        const dataRow1 = wrapper.findAll("tr").at(1);
        const dataRow2 = wrapper.findAll("tr").at(2);

        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(dataRow1.find('td').text()).toBe('4.1');
        expect(dataRow2.find('td').text()).toBe('4.2');

        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(1).text()).toBe('0-15');
        expect(dataRow2.findAll('td').at(1).text()).toBe('15-30');

        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(2).text()).toBe('Female');
        expect(dataRow2.findAll('td').at(2).text()).toBe('Male');

        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(3).text()).toBe('80.00%');
        expect(dataRow2.findAll('td').at(3).text()).toBe('30.00%');

        expect(wrapper.findAll('tr').length).toBe(3);
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

        const dataRow1 = wrapper.findAll("tr").at(1);
        const dataRow2 = wrapper.findAll("tr").at(2);

        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(dataRow1.find('td').text()).toBe('4.2');
        expect(dataRow2.find('td').text()).toBe('4.1');

        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(1).text()).toBe('15-30');
        expect(dataRow2.findAll('td').at(1).text()).toBe('0-15');


        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(2).text()).toBe('Male');
        expect(dataRow2.findAll('td').at(2).text()).toBe('Female');


        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Descending)');
        expect(dataRow1.findAll('td').at(3).text()).toBe('30.00%');
        expect(dataRow2.findAll('td').at(3).text()).toBe('80.00%');

        expect(wrapper.findAll('tr').length).toBe(3);

    });

    it('renders correct markup when sorting by HIV prevalence descending', () => {
        const wrapper = getWrapper();
        wrapper.setData({sortBy: 'prevalence', sortDesc: true});
        expectDefaultTableMarkup(wrapper);
    });

    it('renders correct markup when filtering by 4.2', () => {
        const wrapper = getWrapper();
        wrapper.setData({filter: '4.2'})
        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(wrapper.find('td').text()).toBe('4.2');
        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(1).text()).toBe('15-30');
        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(2).text()).toBe('Male');
        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(wrapper.findAll('td').at(3).text()).toBe('30.00%');
        expect(wrapper.findAll('tr').length).toBe(2);
    });

    it('clicking clear button clears filter and resets table', async () => {
        const wrapper = getWrapper();
        wrapper.setData({filter: '4.2'})
        wrapper.find('button').trigger('click')
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


        const customPropsData = {...propsData, filteredData: filteredDataWithSlotValues};

        const wrapper = mount(Table, {store, propsData: customPropsData, scopedSlots});

        const dataRow1 = wrapper.findAll("tr").at(1);
        const dataRow2 = wrapper.findAll("tr").at(2);

        expect(wrapper.find('th').text()).toBe('Area (Click to sort Ascending)');
        expect(dataRow1.find('td .value').text()).toBe('4.1');
        expect(dataRow1.find('td .small').text()).toBe('3.1');
        expect(dataRow2.find('td .value').text()).toBe('4.2');
        expect(dataRow2.find('td .small').text()).toBe('3.2');

        expect(wrapper.findAll('th').at(1).text()).toBe('Age (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(1).text()).toBe('0-15');
        expect(dataRow2.findAll('td').at(1).text()).toBe('15-30');

        expect(wrapper.findAll('th').at(2).text()).toBe('Sex (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(2).text()).toBe('Female');
        expect(dataRow2.findAll('td').at(2).text()).toBe('Male');

        expect(wrapper.findAll('th').at(3).text()).toBe('HIV prevalence (Click to sort Ascending)');
        expect(dataRow1.findAll('td').at(3).find(".value").text()).toBe('80.00%');
        expect(dataRow1.findAll('td').at(3).find(".small").text()).toBe('(70.00% - 90.00%)');
        expect(dataRow2.findAll('td').at(3).find(".value").text()).toBe('30.00%');
        expect(dataRow2.findAll('td').at(3).find(".small").text()).toBe('(20.00% - 40.00%)');

        expect(wrapper.findAll('tr').length).toBe(3);
    });

});
