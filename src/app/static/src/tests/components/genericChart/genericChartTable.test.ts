import {shallowMount} from "@vue/test-utils";
import GenericChartTable from "../../../app/components/genericChart/GenericChartTable.vue";
import Table from "../../../app/components/plots/table/Table.vue";

describe("GenericChartTable component", () => {
    const tableConfig = {
        "columns": [
            {
                "data": {
                    "columnId": "area_name",
                    "labelFilterId": null
                },
                "header": {
                    "type": "filterLabel",
                    "filterId": "area_name"
                }
            },
            {
                "data": {
                    "columnId": "area_level_id",
                    "labelFilterId": "area_level"
                },
                "header": {
                    "type": "filterLabel",
                    "filterId": "area_level"
                }
            },
            {
                "data": {
                    "columnId": "age_group",
                    "labelFilterId": "age"
                },
                "header": {
                    "type": "filterLabel",
                    "filterId": "age"
                }
            },
            {
                "data": {
                    "columnId": "value",
                    "labelFilterId": null
                },
                "header": {
                    "type": "selectedFilterOption",
                    "filterId": "plot_type"
                }
            }
        ]
    };

    const filteredData = [
        {area_name: "Malawi", area_level_id: 0, age_group: "0:15", plot_type: "prevalence", value: 200},
        {area_name: "Chitipa", area_level_id: 1, age_group: "15:49", plot_type: "prevalence", value: 100}
    ];

    const filters = [
        {
            id: "area_level",
            label: "Area level",
            options: [
                {id: 0, label: "Country"},
                {id: 1, label: "Region"}
            ]
        },
        {
            id: "age",
            label: "Age",
            options: [
                {id: "0:15", label: "0-15"},
                {id: "15:49", label: "15-49"}
            ]
        },
        {
            id: "plot_type",
            label: "Plot type",
            options: [
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
        const propsData = {tableConfig, filteredData, filters, selectedFilterOptions};
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
});
