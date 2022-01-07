import jsonata from "jsonata";
import {actions} from "../../app/store/genericChart/actions";
import {login, rootState} from "./integrationTest";
import {GenericChartDataset, GenericChartMetadataResponse} from "../../app/types";
import {GenericChartMutation} from "../../app/store/genericChart/mutations";
import {getFormData} from "./helpers";
import {actions as baselineActions} from "../../app/store/baseline/actions";
import {actions as sapActions} from "../../app/store/surveyAndProgram/actions"

describe("genericChart actions", () => {
    beforeAll(async () => {
        await login();
    });

    const uploadInputFiles = async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const shapeFormData = getFormData("malawi.geojson");
        await baselineActions.uploadShape({commit, dispatch, rootState} as any, shapeFormData);
        const ancFormData = getFormData("anc.csv");
        await sapActions.uploadANC({commit, dispatch, rootState} as any, ancFormData);
        const artFormData = getFormData("programme.csv")
        await sapActions.uploadProgram({commit, dispatch, rootState} as any, artFormData);
    };

    const getGenericChartMetadata = async () => {
        const commit = jest.fn();
        await actions.getGenericChartMetadata({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("GenericChartMetadataFetched");
        const response = commit.mock.calls[0][0]["payload"] as GenericChartMetadataResponse;
        return response;
    };

    it("can fetch generic chart metadata", async () => {
        const response = await getGenericChartMetadata();
        expect(response["input-time-series"].datasets.length).toBe(2);
        expect(response["input-time-series"].chartConfig[0].config.startsWith("(")).toBe(true);
    });

    it("returned InputTimeSeries jsonata evaluates as expected", async () => {
        // Test data set for three areas, where number of columns is 2, so 2 rows will be required.
        // Each area has two data points. The first two areas' diff between first and second points violates
        // threshold so these will be highlighted, the third area does not.
        const testChartData = {
            "data": [
                {
                    "area_id": "MWI_4_1_demo",
                    "area_name": "Chitipa",
                    "area_level": 4,
                    "quarter": "Q4",
                    "time_period": "2011 Q4",
                    "plot": "art_total",
                    "value": 2116,
                    "page": 1
                },
                {
                    "area_id": "MWI_4_1_demo",
                    "area_name": "Chitipa",
                    "area_level": 4,
                    "quarter": "Q4",
                    "time_period": "2012 Q4",
                    "plot": "art_total",
                    "value": 2663,
                    "page": 1
                },
                {
                    "area_id": "MWI_4_2_demo",
                    "area_name": "Karonga",
                    "area_level": 4,
                    "quarter": "Q4",
                    "time_period": "2011 Q4",
                    "plot": "art_total",
                    "value": 5673,
                    "page": 1
                },
                {
                    "area_id": "MWI_4_2_demo",
                    "area_name": "Karonga",
                    "area_level": 4,
                    "quarter": "Q4",
                    "time_period": "2012 Q4",
                    "plot": "art_total",
                    "value": 7674,
                    "page": 1
                },
                {
                    "area_id": "MWI_4_3_demo",
                    "area_name": "Rumphi",
                    "area_level": 4,
                    "quarter": "Q4",
                    "time_period": "2011 Q4",
                    "plot": "art_total",
                    "value": 4555,
                    "page": 1
                },
                {
                    "area_id": "MWI_4_3_demo",
                    "area_name": "Rumphi",
                    "area_level": 4,
                    "quarter": "Q4",
                    "time_period": "2012 Q4",
                    "plot": "art_total",
                    "value": 4795,
                    "page": 1
                }
            ],
            "subplots": {
                "columns": 2,
                "distinctColumn": "area_name",
                "heightPerRow": 100,
                "subplotsPerPage": 99,
                "rows": 2
            },
            "yAxisFormat": ".0f"
        };

        const response = await getGenericChartMetadata();
        const chartJsonata = response["input-time-series"].chartConfig[0].config;

        const j = jsonata(chartJsonata);
        const result = j.evaluate(testChartData);

        // Some arrays output from jsonata have an additional 'sequence' property so jest's toEqual with array literal fails -
        // but these serialize to the same string
        expect(JSON.stringify(result.data)).toBe(JSON.stringify([
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 2663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"}
            },
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 2663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"}
            },
            {
                "name": "Karonga",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [5673, 7674],
                "xaxis": "x2",
                "yaxis": "y2",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"}
            },
            {
                "name": "Karonga",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [5673, 7674],
                "xaxis": "x2",
                "yaxis": "y2",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"}
            },
            {
                "name": "Rumphi",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [4555, 4795],
                "xaxis": "x3",
                "yaxis": "y3",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"}
            },
            {
                "name": "Rumphi",
                "showlegend": false,
                "x": [],
                "y": [],
                "xaxis": "x3",
                "yaxis": "y3",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"}
            }
        ]));

        expect(result.config).toStrictEqual({
            "responsive": false,
            "scrollZoom": false,
            "modeBarButtonsToRemove": ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d", "resetScale2d", "zoomIn2d", "zoomOut2d"]
        });


        //TODO: split these into separate tests
        const layout = result.layout
        expect(Object.keys(layout)).toStrictEqual([
            "margin", "dragmode", "grid", "annotations",
            "yaxis1", "xaxis1", "yaxis2", "xaxis2", "yaxis3", "xaxis3"
        ]);
        expect(layout.margin).toStrictEqual({"t": 32});
        expect(layout.dragmode).toBe(false);
        expect(layout.grid).toStrictEqual({"columns": 2, "rows": 2, "pattern": "independent"});
        expect(JSON.stringify(layout.annotations)).toBe(JSON.stringify([
            {
                "text": "Chitipa (MWI_4_1_demo)",
                "textfont": {},
                "showarrow": false,
                "x": 0.5,
                "xanchor": "middle",
                "xref": "x1 domain",
                "y": 1.1,
                "yanchor": "middle",
                "yref": "y1 domain"
            },
            {
                "text": "Karonga (MWI_4_2_demo)",
                "textfont": {},
                "showarrow": false,
                "x": 0.5,
                "xanchor": "middle",
                "xref": "x2 domain",
                "y": 1.1,
                "yanchor": "middle",
                "yref": "y2 domain"
            },
            {
                "text": "Rumphi (MWI_4_3_demo)",
                "textfont": {},
                "showarrow": false,
                "x": 0.5,
                "xanchor": "middle",
                "xref": "x3 domain",
                "y": 1.1,
                "yanchor": "middle",
                "yref": "y3 domain"
            }
        ]));

        const expectedYAxisRow1 = {
            "row": 0,
            "rangemode": "tozero",
            "zeroline": false,
            "tickformat": ".0f",
            "tickfont": {"color": "grey"},
            "domain": [1, 0.7]
        };

        const expectedYAxisRow2 = {
            "row": 1,
            "rangemode": "tozero",
            "zeroline": false,
            "tickformat": ".0f",
            "tickfont": {"color": "grey"},
            "domain": [0.5, 0.2]
        };

        const expectedXAxis = {
            "zeroline": false,
            "tickvals": ["2011 Q4", "2012 Q4"],
            "tickfont": {"color": "grey"}
        };

        expect(layout.yaxis1.row).toBe(0);
        expect(layout.yaxis2.row).toBe(0);
        expect(layout.yaxis3.row).toBe(1);

        expect(layout.yaxis1).toStrictEqual(expectedYAxisRow1);
        expect(layout.xaxis1).toStrictEqual(expectedXAxis);

        expect(layout.yaxis2).toStrictEqual(expectedYAxisRow1);
        expect(layout.xaxis2).toStrictEqual(expectedXAxis);

        expect(layout.yaxis3).toStrictEqual(expectedYAxisRow2);
        expect(layout.xaxis3).toStrictEqual(expectedXAxis);
    });

    it("can fetch dataset", async () => {
        await uploadInputFiles();
        const commit = jest.fn();
        const payload = {datasetId: "ART", url: "/chart-data/input-time-series/programme"};
        await actions.getDataset({commit, rootState} as any, payload);
        expect(commit.mock.calls[1][0]["type"]).toBe(GenericChartMutation.SetDataset);
        const response = commit.mock.calls[1][0]["payload"]["dataset"] as GenericChartDataset;
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.data[0].area_id).toContain("MWI");
        expect(response.data[0].value).not.toBeUndefined();
    });
});
