import {CalibrateDataResponse, TableMetadata} from "../../../../app/generated";
import {
    mockCalibrateDataResponse,
    mockFilterSelection,
    mockIndicatorMetadata,
    mockInputComparisonData,
} from "../../../mocks";
import {
    getColumnDefs,
    getTableValues,
    TableHeaderDef
} from "../../../../app/components/plots/table/utils";
import {FilterSelection} from "../../../../app/store/plotSelections/plotSelections";
import {Language} from "../../../../app/store/translations/locales";
import DifferenceColumnRenderer from "../../../../app/components/plots/table/DifferenceColumnRenderer.vue";

describe("getTableValues util works as expected", () => {

    it("can get table values for output plot", () => {
        const data: CalibrateDataResponse["data"][0] = mockCalibrateDataResponse()[0];
        const values = getTableValues("table", null, "sex", data);

        expect(values).toStrictEqual({
            mean_both: 0.5,
            upper_both: 0.5,
            lower_both: 0.5
        });
    });

    it("can get table values for input comparison plot anc", () => {
        let data = mockInputComparisonData().anc[0];
        let values = getTableValues("inputComparisonTable", "anc", "group", data);

        expect(values).toStrictEqual({
            "spectrum_Adult Males": 2001,
            "naomi_Adult Males": 3000,
            "difference_Adult Males": 999
        });

        data = mockInputComparisonData().anc[1];
        values = getTableValues("inputComparisonTable", "anc", "group", data);

        expect(values).toStrictEqual({
            "spectrum_Adult Males": null,
            "naomi_Adult Males": 2000,
            "difference_Adult Males": null
        });
    });

    it("can get table values for input comparison plot art", () => {
        let data = mockInputComparisonData().art[0];
        let values = getTableValues("inputComparisonTable", "art", "group", data);

        expect(values).toStrictEqual({
            "spectrum_reported_Adult Males": 2001,
            "spectrum_adjusted_Adult Males": 2002,
            "spectrum_reallocated_Adult Males": 0,
            "naomi_Adult Males": 3000,
            "difference_Adult Males": 999,
            "difference_ratio_Adult Males": 1 - (999 / 2001)
        });

        data = mockInputComparisonData().art[1];
        values = getTableValues("inputComparisonTable", "art", "group", data);

        expect(values).toStrictEqual({
            "spectrum_reported_Adult Males": null,
            "spectrum_adjusted_Adult Males": null,
            "spectrum_reallocated_Adult Males": null,
            "naomi_Adult Males": 2000,
            "difference_Adult Males": null,
            "difference_ratio_Adult Males": null
        });
    });

    it("throws error when called with unsupported plot name", () => {
        const data: CalibrateDataResponse["data"][0] = mockCalibrateDataResponse()[0];

        expect(() => getTableValues("barchart", "anc", "sex", data)).toThrowError(
            new Error("Unreachable, if seeing this you're missing data type 'barchart' in table data prep util."))
    });
});

describe("getColumnDefs util works as expected", () => {
    const indicatorMetadata = mockIndicatorMetadata();
    const tableMetadata: TableMetadata = {
        row: ["area"],
        column: ["sex"]
    };

    const tableHeaders: TableHeaderDef[] = [
        {columnLabel: "Age", columnField: "age"},
        {columnLabel: "Sex", columnField: "sex"}
    ];

    const expectedBaseCols = [
        {
            "field": "age",
            "filter": "agTextColumnFilter",
            "headerName": "Age",
            "minWidth": 125,
            "pinned": "left",
        },
        {
            "field": "sex",
            "filter": "agTextColumnFilter",
            "headerName": "Sex",
            "minWidth": 125,
            "pinned": "left",
        },
    ];

    it("can get column defs for output table", () => {
        const filterSelections: FilterSelection[] = [
            mockFilterSelection({filterId: "age"}),
            mockFilterSelection({
                filterId: "sex",
                stateFilterId: "sex",
                selection: [
                    {
                        label: "Male",
                        id: "male"
                    },
                    {
                        label: "Female",
                        id: "female"
                    }
                ]
            }),
        ];
        const calibrateData: CalibrateDataResponse["data"] = [
            {
                area_id: "MWI",
                sex: "male",
                age_group: "1",
                calendar_quarter: "1",
                indicator_id: 1,
                indicator: 'mock',
                lower: 0.5,
                mean: 0.5,
                mode: 0.5,
                upper: 0.5
            },
            {
                area_id: "MWI",
                sex: "female",
                age_group: "1",
                calendar_quarter: "1",
                indicator_id: 1,
                indicator: 'mock',
                lower: 0.6,
                mean: 0.6,
                mode: 0.6,
                upper: 0.6
            }
        ];

        const colDefs = getColumnDefs("table", null, indicatorMetadata, tableMetadata,
            filterSelections, tableHeaders, Language.en);

        expect(colDefs).toHaveLength(4);
        expect(colDefs.slice(0, 2)).toStrictEqual(expectedBaseCols);

        // We need some data to test the additional columns
        const valueCols = colDefs.slice(2);
        expect(valueCols[0].headerName).toStrictEqual("Male");
        expect(valueCols[1].headerName).toStrictEqual("Female");

        const values = calibrateData.map(row => getTableValues("table", null, "sex", row));

        expect(valueCols[0].valueGetter({data: values[0]})).toStrictEqual(0.5);
        expect(valueCols[0].valueFormatter({data: values[0], value: 0.5})).toStrictEqual("0.50 (0.50 - 0.50)");
        expect(valueCols[1].valueGetter({data: values[1]})).toStrictEqual(0.6);
        expect(valueCols[1].valueFormatter({data: values[1], value: 0.6})).toStrictEqual("0.60 (0.60 - 0.60)");
    });

    it("can get column defs for input comparison table anc", () => {
        const tableMetadata: TableMetadata = {
            row: ["area"],
            column: ["group"]
        };
        const filterSelections: FilterSelection[] = [
            mockFilterSelection({filterId: "age"}),
            mockFilterSelection({
                filterId: "group",
                stateFilterId: "group",
                selection: [
                    {
                        label: "Adult Males",
                        id: "Adult Males"
                    },
                    {
                        label: "Adult Females",
                        id: "Adult Females"
                    }
                ]
            }),
        ];
        const inputComparisonData = mockInputComparisonData();

        const colDefs = getColumnDefs("inputComparisonTable", "anc", indicatorMetadata, tableMetadata,
            filterSelections, tableHeaders, Language.en);

        expect(colDefs).toHaveLength(4);
        expect(colDefs.slice(0, 2)).toStrictEqual(expectedBaseCols);

        // We need some data to test the additional columns
        const valueCols = colDefs.slice(2);
        expect(valueCols[0].headerName).toStrictEqual("Adult Males");
        expect(valueCols[1].headerName).toStrictEqual("Adult Females");

        expect(valueCols[0].children).toHaveLength(3);
        expect(valueCols[1].children).toHaveLength(3);

        const values = inputComparisonData.anc.map(row => {
            return getTableValues("inputComparisonTable", "anc", "group", row)
        });

        // Pulls out correct data from disaggregation and naomi/spectrum/difference
        const spectrumColDef = valueCols[0].children[0];
        const naomiColDef = valueCols[0].children[1];
        const differenceColDef = valueCols[0].children[2];

        expect(naomiColDef.valueGetter({data: values[0]})).toBe(inputComparisonData.anc[0].value_naomi);
        expect(spectrumColDef.valueGetter({data: values[0]})).toBe(inputComparisonData.anc[0].value_spectrum);
        const valueNaomi = inputComparisonData.anc[0].value_naomi;
        const valueSpectrum = inputComparisonData.anc[0].value_spectrum;
        expect(differenceColDef.valueGetter({data: values[0]})).toBe(valueNaomi! - valueSpectrum!);
        expect(naomiColDef.valueFormatter({value: 200})).toStrictEqual("200.00");

        // Col with null is still null
        expect(naomiColDef.valueGetter({data: values[1]})).toBe(inputComparisonData.anc[1].value_naomi);
        expect(spectrumColDef.valueGetter({data: values[1]})).toBeNull();
        expect(differenceColDef.valueGetter({data: values[1]})).toBeNull();
        expect(spectrumColDef.valueFormatter({value: null})).toBeNull();

        // Difference column has correct renderer
        // Hard to test actual class given to different values here, leave this for playwright tests
        expect(differenceColDef.cellRenderer).toBe(DifferenceColumnRenderer);

        // Non-difference columns have null styling
        expect(naomiColDef.cellRenderer).toBeNull();
    });

    it("can get column defs for input comparison table art", () => {
        const tableMetadata: TableMetadata = {
            row: ["area"],
            column: ["group"]
        };
        const filterSelections: FilterSelection[] = [
            mockFilterSelection({filterId: "age"}),
            mockFilterSelection({
                filterId: "group",
                stateFilterId: "group",
                selection: [
                    {
                        label: "Adult Males",
                        id: "Adult Males"
                    },
                    {
                        label: "Adult Females",
                        id: "Adult Females"
                    }
                ]
            }),
        ];
        const inputComparisonData = mockInputComparisonData();

        const colDefs = getColumnDefs("inputComparisonTable", "art", indicatorMetadata, tableMetadata,
            filterSelections, tableHeaders, Language.en);

        expect(colDefs).toHaveLength(4);
        expect(colDefs.slice(0, 2)).toStrictEqual(expectedBaseCols);

        // We need some data to test the additional columns
        const valueCols = colDefs.slice(2);
        expect(valueCols[0].headerName).toStrictEqual("Adult Males");
        expect(valueCols[1].headerName).toStrictEqual("Adult Females");

        expect(valueCols[0].children).toHaveLength(5);
        expect(valueCols[1].children).toHaveLength(5);

        const values = inputComparisonData.art.map(row => {
            return getTableValues("inputComparisonTable", "art", "group", row)
        });

        // Pulls out correct data from disaggregation and naomi/spectrum/difference
        const spectrumReportedColDef = valueCols[0].children[0];
        const spectrumAdjustedColDef = valueCols[0].children[1];
        const naomiColDef = valueCols[0].children[2];
        const differenceColDef = valueCols[0].children[3];
        const differenceRatioColDef = valueCols[0].children[4];

        expect(naomiColDef.valueGetter({data: values[0]})).toBe(inputComparisonData.art[0].value_naomi);
        expect(spectrumAdjustedColDef.valueGetter({data: values[0]})).toBe(inputComparisonData.art[0].value_spectrum_adjusted);
        expect(spectrumReportedColDef.valueGetter({data: values[0]})).toBe(inputComparisonData.art[0].value_spectrum_reported);
        const valueNaomi = inputComparisonData.art[0].value_naomi;
        const valueSpectrum = inputComparisonData.art[0].value_spectrum_reported;
        expect(differenceColDef.valueGetter({data: values[0]})).toBe(valueNaomi! - valueSpectrum!);
        expect(naomiColDef.valueFormatter({value: 200})).toStrictEqual("200.00");
        expect(differenceRatioColDef.valueGetter({data: values[0]})).not.toBeNull();

        // Col with null is still null
        expect(naomiColDef.valueGetter({data: values[1]})).toBe(inputComparisonData.art[1].value_naomi);
        expect(spectrumAdjustedColDef.valueGetter({data: values[1]})).toBeNull();
        expect(differenceColDef.valueGetter({data: values[1]})).toBeNull();
        expect(spectrumAdjustedColDef.valueFormatter({value: null})).toBeNull();

        // Difference column has correct renderer
        // Hard to test actual class given to different values here, leave this for playwright tests
        expect(differenceColDef.cellRenderer).toBe(DifferenceColumnRenderer);

        // Non-difference columns have null styling
        expect(naomiColDef.cellRenderer).toBeNull();
    });

    it("returns only base columns if no columns selected", () => {
        const filterSelections: FilterSelection[] = [];
        const colDefs = getColumnDefs("table", "anc", indicatorMetadata, tableMetadata,
            filterSelections, tableHeaders, Language.en);

        expect(colDefs).toHaveLength(2);
        expect(colDefs).toStrictEqual(expectedBaseCols);
    });
});
