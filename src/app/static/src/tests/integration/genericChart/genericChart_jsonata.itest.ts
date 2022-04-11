import jsonata from "jsonata";
import {getGenericChartMetadata} from "./genericChart.itest";
import {login} from "../integrationTest";

// Test data set for three areas, where number of columns is 2, so 2 rows will be required.
// Each area has two data points. The first two areas' diff between first and second points violates
// threshold so these will be highlighted, the third area does not.
const testChartData = {
    "data": [
        {
            "area_id": "MWI_4_1_demo",
            "area_name": "Chitipa",
            "area_hierarchy": "Northern/Chitipa",
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
            "area_hierarchy": "Northern/Chitipa",
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
            "area_hierarchy": "Northern/Karonga",
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
            "area_hierarchy": "Northern/Karonga",
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
            "area_hierarchy": "Northern/Rumphi",
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
            "area_hierarchy": "Northern/Rumphi",
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

let inputTimeSeriesJsonata: any;
let inputTimeSeriesJsonataResult: any;

const expectedXAxis = {
    "zeroline": false,
    "tickvals": ["2011 Q4", "2012 Q4"],
    "tickfont": {"color": "grey"}
};

const expectYAxis = (domainStart: number, domainEnd: number, actual: any) => {
    expect(Object.keys(actual)).toStrictEqual(["rangemode", "zeroline", "tickformat", "tickfont", "domain"]);
    expect(actual.rangemode).toBe("tozero");
    expect(actual.zeroline).toBe(false);
    expect(actual.tickformat).toBe(".0f");
    expect(actual.tickfont).toStrictEqual({"color": "grey"});
    expect(actual.domain[0]).toBeCloseTo(domainStart, 8);
    expect(actual.domain[1]).toBeCloseTo(domainEnd, 8);
};

describe("inputTimeSeries jsonata", () => {
    beforeAll(async () => {
        await login();

        const response = await getGenericChartMetadata();
        const inputTimeSeriesJsonataText = response["input-time-series"].chartConfig[0].config;

        inputTimeSeriesJsonata = jsonata(inputTimeSeriesJsonataText);
        inputTimeSeriesJsonataResult = inputTimeSeriesJsonata.evaluate(testChartData);
    });

    it("evaluates data as expected", async () => {
        // Some arrays output from jsonata have an additional 'sequence' value so jest's toEqual with array literal fails -
        // but these serialize to the same string
        expect(JSON.stringify(inputTimeSeriesJsonataResult.data)).toBe(JSON.stringify([
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 2663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Chitipa<extra></extra>"
            },
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 2663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Chitipa<extra></extra>"
            },
            {
                "name": "Karonga",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [5673, 7674],
                "xaxis": "x2",
                "yaxis": "y2",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Karonga<extra></extra>"
            },
            {
                "name": "Karonga",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [5673, 7674],
                "xaxis": "x2",
                "yaxis": "y2",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Karonga<extra></extra>"
            },
            {
                "name": "Rumphi",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [4555, 4795],
                "xaxis": "x3",
                "yaxis": "y3",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Rumphi<extra></extra>"
            },
            {
                "name": "Rumphi",
                "showlegend": false,
                "x": [],
                "y": [],
                "xaxis": "x3",
                "yaxis": "y3",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Rumphi<extra></extra>"
            }
        ]));
    });

    it("evaluates config as expected", () => {
        expect(inputTimeSeriesJsonataResult.config).toStrictEqual({
            "responsive": false,
            "scrollZoom": false,
            "modeBarButtonsToRemove": ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d", "resetScale2d", "zoomIn2d", "zoomOut2d"]
        });
    });

    it("evaluates top level layout properties as expected", () => {
        const layout = inputTimeSeriesJsonataResult.layout;
        expect(Object.keys(layout)).toStrictEqual([
            "margin", "dragmode", "grid", "annotations",
            "yaxis1", "xaxis1", "yaxis2", "xaxis2", "yaxis3", "xaxis3"
        ]);
        expect(layout.margin).toStrictEqual({"t": 32});
        expect(layout.dragmode).toBe(false);
        expect(layout.grid).toStrictEqual({"columns": 2, "rows": 2, "pattern": "independent"});
    });

    it("evaluates layout annotations as expected", () => {
        const layout = inputTimeSeriesJsonataResult.layout;
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
    });

    it("evaluates layout axes as expected", () => {
        const layout = inputTimeSeriesJsonataResult.layout;

        expect(layout.xaxis1).toStrictEqual(expectedXAxis);
        expect(layout.xaxis2).toStrictEqual(expectedXAxis);
        expect(layout.xaxis3).toStrictEqual(expectedXAxis);

        expectYAxis(1, 0.7, layout.yaxis1);
        expectYAxis(1, 0.7, layout.yaxis2);
        expectYAxis(0.5, 0.2, layout.yaxis3);
    });

    it("evaluates separate subplots for different areas with identical names", () => {
        const testData_DuplicateNames =  {
            "data": [
                {
                    "area_id": "MWI_4_1_demo",
                    "area_name": "Chitipa",
                    "area_hierarchy": "Northern/Chitipa",
                    "time_period": "2011 Q4",
                    "value": 2116
                },
                {
                    "area_id": "MWI_4_1_demo",
                    "area_name": "Chitipa",
                    "area_hierarchy": "Northern/Chitipa",
                    "time_period": "2012 Q4",
                    "value": 2663
                },
                {
                    "area_id": "MWI_4_2_demo",
                    "area_name": "Karonga",
                    "area_hierarchy": "Northern/Karonga",
                    "time_period": "2011 Q4",
                    "value": 5673
                },
                {
                    "area_id": "MWI_4_2_demo",
                    "area_name": "Karonga",
                    "area_hierarchy": "Northern/Karonga",
                    "time_period": "2012 Q4",
                    "value": 7674
                },
                {
                    "area_id": "MWI_4_3_demo",
                    "area_name": "Chitipa",
                    "area_hierarchy": "Southern/Chitipa",
                    "time_period": "2011 Q4",
                    "value": 4555
                },
                {
                    "area_id": "MWI_4_3_demo",
                    "area_name": "Chitipa",
                    "area_hierarchy": "Southern/Chitipa",
                    "time_period": "2012 Q4",
                    "value": 4795
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

        const result = inputTimeSeriesJsonata.evaluate(testData_DuplicateNames);

        expect(JSON.stringify(result.data)).toBe(JSON.stringify([
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 2663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Chitipa<extra></extra>"
            },
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 2663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Chitipa<extra></extra>"
            },
            {
                "name": "Karonga",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [5673, 7674],
                "xaxis": "x2",
                "yaxis": "y2",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Karonga<extra></extra>"
            },
            {
                "name": "Karonga",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [5673, 7674],
                "xaxis": "x2",
                "yaxis": "y2",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Northern/Karonga<extra></extra>"
            },
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [4555, 4795],
                "xaxis": "x3",
                "yaxis": "y3",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Southern/Chitipa<extra></extra>"
            },
            {
                "name": "Chitipa",
                "showlegend": false,
                "x": [],
                "y": [],
                "xaxis": "x3",
                "yaxis": "y3",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<br>Southern/Chitipa<extra></extra>"
            }
        ]));

        const layout = result.layout;
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
                "text": "Chitipa (MWI_4_3_demo)",
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

        expect(layout.xaxis1).toStrictEqual(expectedXAxis);
        expect(layout.xaxis2).toStrictEqual(expectedXAxis);
        expect(layout.xaxis3).toStrictEqual(expectedXAxis);

        expectYAxis(1, 0.7, layout.yaxis1);
        expectYAxis(1, 0.7, layout.yaxis2);
        expectYAxis(0.5, 0.2, layout.yaxis3);
    });

    it("evaluates single-line tooltips for area with null hierarchy", () => {
        const testData_NullHierarchy = {
            "data": [
                {
                    "area_id": "MWI_1_1_demo",
                    "area_name": "Malawi",
                    "area_hierarchy": null,
                    "time_period": "2011 Q4",
                    "value": 2116
                },
                {
                    "area_id": "MWI_1_1_demo",
                    "area_name": null,
                    "area_hierarchy": "Northern/Chitipa",
                    "time_period": "2012 Q4",
                    "value": 4663
                }
            ]
        };

        const result = inputTimeSeriesJsonata.evaluate(testData_NullHierarchy);

        expect(JSON.stringify(result.data)).toBe(JSON.stringify([
            {
                "name": "Malawi",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 4663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(51, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<extra></extra>"
            },
            {
                "name": "Malawi",
                "showlegend": false,
                "x": ["2011 Q4", "2012 Q4"],
                "y": [2116, 4663],
                "xaxis": "x1",
                "yaxis": "y1",
                "type": "scatter",
                "line": {"color": "rgb(255, 51, 51)"},
                "hovertemplate": "(%{x}, %{y})<extra></extra>"
            }
        ]));
    });
});
