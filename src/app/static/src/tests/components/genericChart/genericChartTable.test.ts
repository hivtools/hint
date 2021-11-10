import {shallowMount, mount} from "@vue/test-utils";
import GenericChartTable from "../../../app/components/genericChart/GenericChartTable.vue";
import Table from "../../../app/components/plots/table/Table.vue";
import Vuex from "vuex";
import {Language} from "../../../app/store/translations/locales";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("GenericChartTable component", () => {
    const tableConfig = {
        "columns": [
            {
                "data": {
                    "columnId": "area_name"
                },
                "header": {
                    "type": "columnLabel",
                    "column": "area_name"
                }
            },
            {
                "data": {
                    "columnId": "area_level_id",
                    "labelColumn": "area_level"
                },
                "header": {
                    "type": "columnLabel",
                    "column": "area_level"
                }
            },
            {
                "data": {
                    "columnId": "age_group",
                    "labelColumn": "age"
                },
                "header": {
                    "type": "columnLabel",
                    "column": "age"
                }
            },
            {
                "data": {
                    "columnId": "value"
                },
                "header": {
                    "type": "selectedFilterOption",
                    "column": "plot_type"
                }
            }
        ]
    };

    const filteredData = [
        {area_name: "Malawi", area_level_id: 0, age_group: "0:15", plot_type: "prevalence", value: 200},
        {area_name: "Chitipa", area_level_id: 1, age_group: "15:49", plot_type: "prevalence", value: 100}
    ];

    const columns = [
        {
            id: "area_level",
            label: "Area level",
            column_id: "area_level",
            values: [
                {id: 0, label: "Country"},
                {id: 1, label: "Region"}
            ]
        },
        {
            id: "age",
            label: "Age",
            column_id: "age_group",
            values: [
                {id: "0:15", label: "0-15"},
                {id: "15:49", label: "15-49"}
            ]
        },
        {
            id: "plot_type",
            label: "Plot type",
            column_id: "plot_type",
            values: [
                {id: "prevalence", label: "HIV prevalence"},
                {id: "plhiv", label: "PLHIV"}
            ]
        }
    ];

    const selectedFilterOptions = {
        area_level: [{id: "area1", label: "Area One"}],
        plot_type: [{id: "prevalence", label: "HIV prevalence"}]
    };

    const getWrapper = () => {
        const propsData = {tableConfig, filteredData, columns, selectedFilterOptions};
        return shallowMount(GenericChartTable, {propsData});
    };

    it("renders table component with expected fields", () => {
        const wrapper = getWrapper();
        const table = wrapper.find(Table);
        const expectedFields = [
            {key: "area_name", label: "area_name", sortable: true, sortByFormatted: true},
            {key: "area_level_id", label: "Area level", sortable: true, sortByFormatted: true},
            {key: "age_group", label: "Age", sortable: true, sortByFormatted: true},
            {key: "value", label: "HIV prevalence", sortable: true, sortByFormatted: true}
        ];
        expect(table.props("fields")).toStrictEqual(expectedFields);
    });

    it("renders table component with expected labelled data", () => {
        const wrapper = getWrapper();
        const table = wrapper.find(Table);
        const expectedData = [
            {area_name: "Malawi", area_level_id: "Country", age_group: "0-15", plot_type: "prevalence", value: 200},
            {area_name: "Chitipa", area_level_id: "Region", age_group: "15-49", plot_type: "prevalence", value: 100}
        ];
        expect(table.props("filteredData")).toStrictEqual(expectedData);
    });

    const tableConfigWithHierarchy = {
        "columns": [
            {
                "data": {
                    "columnId": "area_name",
                    "hierarchyColumn": "area"
                },
                "header": {
                    "type": "columnLabel",
                    "column": "area_name"
                }
            }
        ]
    };

    const columnsWithHierarchy = [
        {
            id: "area",
            label: "Area",
            column_id: "area_id",
            values: [
                {
                    id: "MWI",
                    label: "Malawi",
                    children: [
                        {
                            id: "MWI_1",
                            label: "Northern",
                            children: [
                                {id: "MWI_1_1", label: "Karonga"},
                                {id: "MWI_1_2", label: "Chitipa"}
                            ]
                        },
                        {
                            id: "MWI_2",
                            label: "Southern"
                        }
                    ]
                }
            ]
        }
    ];

    const filteredDataWithHierarchy = [
        {area_name: "Malawi", area_id: "MWI", value: 200},
        {area_name: "Chitipa", area_id: "MWI_1_2", value: 100},
        {area_name: "Southern", area_id: "MWI_2", value: 150}
    ];

    const propsDataWithHierarchy = {
        tableConfig: tableConfigWithHierarchy,
        filteredData: filteredDataWithHierarchy,
        columns: columnsWithHierarchy,

        selectedFilterOptions
    };

    it("renders table component with hierarchy column", () => {
        const wrapper = shallowMount(GenericChartTable, {propsData: propsDataWithHierarchy});

        const table = wrapper.find(Table);
        const expectedData = [
            {area_name: "Malawi", area_id: "MWI", value: 200, area_name_hierarchy: ""},
            {area_name: "Chitipa", area_id: "MWI_1_2", value: 100, area_name_hierarchy: "Malawi/Northern"},
            {area_name: "Southern", area_id: "MWI_2", value: 150, area_name_hierarchy: "Malawi"}
        ];
        expect(table.props("filteredData")).toStrictEqual(expectedData);

        const expectedFields = [
            {key: "area_name", label: "area_name", sortable: true, sortByFormatted: true}
        ];
        expect(table.props("fields")).toStrictEqual(expectedFields);
    });

    it("renders markup for hierarchy column", () => {
        const store = new Vuex.Store({
            state: {language: Language.en}
        });
        registerTranslations(store);
        const wrapper = mount(GenericChartTable, {propsData: propsDataWithHierarchy, store});

        const table = wrapper.find(Table);
        const rows = table.findAll("tr");
        expect(rows.at(1).findAll("td").at(0).find("div.column-data").text()).toBe("Malawi");
        expect(rows.at(1).findAll("td").at(0).find("div.small").text()).toBe("");

        expect(rows.at(2).findAll("td").at(0).find("div.column-data").text()).toBe("Chitipa");
        expect(rows.at(2).findAll("td").at(0).find("div.small").text()).toBe("Malawi/Northern");

        expect(rows.at(3).findAll("td").at(0).find("div.column-data").text()).toBe("Southern");
        expect(rows.at(3).findAll("td").at(0).find("div.small").text()).toBe("Malawi");
    });
});
