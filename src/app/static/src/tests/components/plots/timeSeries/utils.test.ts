import {
    expressionToString,
    getChartDataByArea,
    getChartDataByIndicatorGroup,
    getLayoutFromData,
    getScatterPointsFromAreaIds,
    getScatterPointsFromIndicator,
    getTooltipTemplate,
    numeralJsToD3format,
    Operator,
    PlotColours,
    timeSeriesFixedColours
} from "../../../../app/components/plots/timeSeries/utils";
import {format} from "d3-format";
import {InputTimeSeriesData} from "../../../../app/generated";
import {Language} from "../../../../app/store/translations/locales";

describe("time series utils", () => {
    describe("numeralJSToD3Format", () => {
        it("converts numeric formats as expected", () => {
            const testValue = 123.789;

            let result = numeralJsToD3format("0");
            expect(result).toBe(".0f");
            expect(format(result)(testValue)).toBe("124");

            result = numeralJsToD3format("0.0");
            expect(result).toBe(".1f");
            expect(format(result)(testValue)).toBe("123.8");

            result = numeralJsToD3format("0.00");
            expect(result).toBe(".2f");
            expect(format(result)(testValue)).toBe("123.79");
        });

        it("converts percentage formats as expected", () => {
            const testValue = 0.98765;

            let result = numeralJsToD3format("0%");
            expect(result).toBe(".0%");
            expect(format(result)(testValue)).toBe("99%");

            result = numeralJsToD3format("0.0%");
            expect(result).toBe(".1%");
            expect(format(result)(testValue)).toBe("98.8%");

            result = numeralJsToD3format("0.00%");
            expect(result).toBe(".2%");
            expect(format(result)(testValue)).toBe("98.77%");
        });

        it("converts thousand separator formats as expected", () => {
            const testValue = 100000;

            let result = numeralJsToD3format("0,0");
            expect(result).toBe(",");
            expect(format(result)(testValue)).toBe("100,000");
        });

        it("returns empty string for unsupported formats", () => {
            expect(numeralJsToD3format("0.")).toBe("");
            expect(numeralJsToD3format("00")).toBe("");
            expect(numeralJsToD3format(".%")).toBe("");
            expect(numeralJsToD3format("0a")).toBe("");
        });
    });

    describe("build scatter plot layout and data", () => {
        // This test checks with 4 data points
        // All 4 of which should be highlighted (and the lines between them)
        // The 3rd point contains missing data and so should be coloured appropriately
        const chartData = [
            {
                area_id: "area_1",
                area_hierarchy: "hierarchy11",
                area_level: 4,
                area_name: "name11",
                time_period: "date11",
                value: 1
            },
            {
                area_id: "area_1",
                area_hierarchy: "hierarchy12",
                area_level: 4,
                area_name: "name12",
                time_period: "date12",
                value: 2
            },
            {
                area_id: "area_2",
                area_hierarchy: "hierarchy21",
                area_level: 4,
                area_name: "name21",
                time_period: "date21",
                value: 3,
                missing_ids: ["area_2_1", "area_2_2"]
            },
            {
                area_id: "area_2",
                area_hierarchy: "hierarchy22",
                area_level: 4,
                area_name: "name22",
                time_period: "date22",
                value: 4
            }
        ] as any as InputTimeSeriesData;

        const layoutData = {
            yAxisFormat: ",",
            subplots: {
                rows: 2,
                distinctColumn: "area_id"
            }
        };

        const expectedLayout = {
            annotations: [
                {
                    showarrow: false,
                    text: "name11 (area_1)",
                    textfont: {},
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x1 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y1 domain"
                },
                {
                    showarrow: false,
                    text: "name21 (area_2)",
                    textfont: {},
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x2 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y2 domain"
                },
            ],
            dragmode: false,
            grid: {
                columns: undefined,
                pattern: "independent",
                rows: 2,
                xgap: 0.25,
                ygap: 0.4
            },
            margin: {
                t: 32,
            },
            xaxis1: {
                autorange: true,
                tickfont: {color: "grey"},
                tickvals: ["date11", "date22"],
                type: "category",
                zeroline: false
            },
            xaxis2: {
                autorange: true,
                tickfont: {color: "grey"},
                tickvals: ["date11", "date22"],
                type: "category",
                zeroline: false
            },
            yaxis1: {
                range: [
                    -0.2,
                    2.2
                ],
                domain: [NaN, NaN],
                tickfont: {color: "grey"},
                tickformat: ",",
                type: "linear",
                zeroline: false
            },
            yaxis2: {
                range: [
                    -0.4,
                    4.4
                ],
                domain: [NaN, NaN],
                tickfont: {color: "grey"},
                tickformat: ",",
                type: "linear",
                zeroline: false
            },
        } as any

        const expectedData = [
            {
                hovertemplate: Array(2).fill("%{x}, %{y}<br>hierarchy11<extra></extra>"),
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                    line: {
                        color: [PlotColours.HIGHLIGHT.BASE, PlotColours.HIGHLIGHT.BASE],
                        width: 0.5
                    }
                },
                name: "name11",
                plotType: null,
                showlegend: false,
                type: "scatter",
                x: ["date11", "date12"],
                xaxis: "x1",
                y: [1, 2],
                yaxis: "y1"
            },
            {
                hovertemplate: [
                    "%{x}, %{y}<br>hierarchy21<br>Aggregate value missing data for 2 regions<extra></extra>",
                    "%{x}, %{y}<br>hierarchy21<extra></extra>"
                ],
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: [PlotColours.HIGHLIGHT.MISSING, PlotColours.HIGHLIGHT.BASE],
                    line: {
                        color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                        width: 0.5
                    }
                },
                name: "name21",
                plotType: null,
                showlegend: false,
                type: "scatter",
                x: ["date21", "date22"],
                xaxis: "x2",
                y: [3, 4],
                yaxis: "y2"
            },
        ] as any

        const dataByArea = getChartDataByArea(chartData);
        const timePeriods = chartData.map(dataPoint => dataPoint.time_period).sort() || [];

        it("can build layout from data", () => {
            const layout = getLayoutFromData(dataByArea, layoutData, timePeriods);
            expect(layout).toStrictEqual(expectedLayout)
        });

        it("can build scatter points from data", () => {
            const data = getScatterPointsFromAreaIds(dataByArea, Language.en);
            expect(data).toStrictEqual(expectedData)
        });
    });

    const expectedXAxis = {
        zeroline: false,
        tickvals: ["2011 Q4", "2012 Q4"],
        tickfont: {color: "grey"},
        autorange: true,
        type: "category"
    };

    const expectYAxis = (domainStart: number, domainEnd: number, actual: any, tickFormat: any = ".0f") => {
        expect(Object.keys(actual)).toStrictEqual(["zeroline", "tickformat", "tickfont", "domain", "range", "type"]);
        expect(actual.zeroline).toBe(false);
        expect(actual.tickformat).toBe(tickFormat);
        expect(actual.tickfont).toStrictEqual({color: "grey"});
        expect(actual.range[0]).toBeLessThan(0);
        expect(actual.range[1]).toBeGreaterThan(2663);
        expect(actual.domain[0]).toBeCloseTo(domainStart, 8);
        expect(actual.domain[1]).toBeCloseTo(domainEnd, 8);
    };

    describe("can build layout and scatter points from dummy MWI data", () => {
        // Test data set for four areas, where number of columns is 2, so 2 rows will be required.
        // Areas 1 to 3 have two data points. The first two areas' diff between first and second points violates
        // threshold so these will be highlighted, the third area does not.
        // The fourth area has only 1 data point
        const chartData = [
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                area_level: 4,
                quarter: "Q4",
                time_period: "2011 Q4",
                plot: "art_total",
                value: 2116,
                page: 1
            },
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                area_level: 4,
                quarter: "Q4",
                time_period: "2012 Q4",
                plot: "art_total",
                value: 2663,
                page: 1
            },
            {
                area_id: "MWI_4_2_demo",
                area_name: "Karonga",
                area_hierarchy: "Northern/Karonga",
                area_level: 4,
                quarter: "Q4",
                time_period: "2011 Q4",
                plot: "art_total",
                value: 5673,
                page: 1
            },
            {
                area_id: "MWI_4_2_demo",
                area_name: "Karonga",
                area_hierarchy: "Northern/Karonga",
                area_level: 4,
                quarter: "Q4",
                time_period: "2012 Q4",
                plot: "art_total",
                value: 7674,
                page: 1
            },
            {
                area_id: "MWI_4_3_demo",
                area_name: "Rumphi",
                area_hierarchy: "Northern/Rumphi",
                area_level: 4,
                quarter: "Q4",
                time_period: "2011 Q4",
                plot: "art_total",
                value: 4555,
                page: 1
            },
            {
                area_id: "MWI_4_3_demo",
                area_name: "Rumphi",
                area_hierarchy: "Northern/Rumphi",
                area_level: 4,
                quarter: "Q4",
                time_period: "2012 Q4",
                plot: "art_total",
                value: 4795,
                page: 1
            },
            {
                area_id: "MWI_4_4_demo",
                area_name: "Mzuzu City",
                area_hierarchy: "Northern/Mzuzu City",
                area_level: 4,
                quarter: "Q4",
                time_period: "2012 Q4",
                plot: "art_total",
                value: 1024,
                page: 1
            }
        ] as any as InputTimeSeriesData;

        const layoutData = {
            subplots: {
                columns: 2,
                distinctColumn: "area_id",
                heightPerRow: 100,
                subplotsPerPage: 99,
                rows: 2
            },
            yAxisFormat: ".0f"
        };

        const expectedData = [
            {
                name: "Chitipa",
                plotType: null,
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [2116, 2663],
                xaxis: "x1",
                yaxis: "y1",
                type: "scatter",
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.HIGHLIGHT.BASE)
                    }
                },
                hovertemplate: Array(2).fill("%{x}, %{y}<br>Northern/Chitipa<extra></extra>")
            },
            {
                name: "Karonga",
                plotType: null,
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [5673, 7674],
                xaxis: "x2",
                yaxis: "y2",
                type: "scatter",
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.HIGHLIGHT.BASE)
                    }
                },
                hovertemplate: Array(2).fill("%{x}, %{y}<br>Northern/Karonga<extra></extra>")
            },
            {
                name: "Rumphi",
                plotType: null,
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [4555, 4795],
                xaxis: "x3",
                yaxis: "y3",
                type: "scatter",
                line: {color: PlotColours.NORMAL.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.NORMAL.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.NORMAL.BASE)
                    }
                },
                hovertemplate: Array(2).fill("%{x}, %{y}<br>Northern/Rumphi<extra></extra>")
            },
            {
                name: "Mzuzu City",
                plotType: null,
                showlegend: false,
                x: ["2012 Q4"],
                y: [1024],
                xaxis: "x4",
                yaxis: "y4",
                type: "scatter",
                line: {color: PlotColours.NORMAL.BASE, dash: "solid"},
                marker: {
                    color: [PlotColours.NORMAL.BASE],
                    line: {
                        width: 0.5,
                        color: [PlotColours.NORMAL.BASE]
                    }
                },
                hovertemplate: ["%{x}, %{y}<br>Northern/Mzuzu City<extra></extra>"]
            }
        ] as any

        const dataByArea = getChartDataByArea(chartData);
        const timePeriods = chartData.map(dataPoint => dataPoint.time_period).sort() || [];

        it("can build scatter points from data", () => {
            const data = getScatterPointsFromAreaIds(dataByArea, Language.en);
            expect(data).toStrictEqual(expectedData)
        });

        it("can build layout data", () => {
            const layout = getLayoutFromData(dataByArea, layoutData, timePeriods);

            expect(Object.keys(layout)).toStrictEqual([
                "margin", "dragmode", "grid", "annotations",
                "yaxis1", "xaxis1", "yaxis2", "xaxis2", "yaxis3", "xaxis3", "yaxis4", "xaxis4"
            ]);
            expect(layout.margin).toStrictEqual({t: 32});
            expect(layout.dragmode).toBe(false);
            expect(layout.grid).toStrictEqual({
                columns: 2,
                rows: 2,
                pattern: "independent",
                xgap: 0.25,
                ygap: 0.4,
            });

            expect(layout.annotations).toStrictEqual([
                {
                    text: "Chitipa (MWI_4_1_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x1 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y1 domain"
                },
                {
                    text: "Karonga (MWI_4_2_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x2 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y2 domain"
                },
                {
                    text: "Rumphi (MWI_4_3_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x3 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y3 domain"
                },
                {
                    text: "Mzuzu City (MWI_4_4_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x4 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y4 domain"
                }
            ]);

            expect(layout.xaxis1).toStrictEqual(expectedXAxis);
            expect(layout.xaxis2).toStrictEqual(expectedXAxis);
            expect(layout.xaxis3).toStrictEqual(expectedXAxis);
            expect(layout.xaxis4).toStrictEqual(expectedXAxis);

            expectYAxis(1, 0.7, layout.yaxis1);
            expectYAxis(1, 0.7, layout.yaxis2);
            expectYAxis(0.5, 0.2, layout.yaxis3);
        });
    });

    describe("evaluates separate subplots for different areas with identical names", () => {
        const chartData = [
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                time_period: "2011 Q4",
                value: 2116
            },
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                time_period: "2012 Q4",
                value: 2663
            },
            {
                area_id: "MWI_4_2_demo",
                area_name: "Karonga",
                area_hierarchy: "Northern/Karonga",
                time_period: "2011 Q4",
                value: 5673
            },
            {
                area_id: "MWI_4_2_demo",
                area_name: "Karonga",
                area_hierarchy: "Northern/Karonga",
                time_period: "2012 Q4",
                value: 7674
            },
            {
                area_id: "MWI_4_3_demo",
                area_name: "Chitipa",
                area_hierarchy: "Southern/Chitipa",
                time_period: "2011 Q4",
                value: 4555
            },
            {
                area_id: "MWI_4_3_demo",
                area_name: "Chitipa",
                area_hierarchy: "Southern/Chitipa",
                time_period: "2012 Q4",
                value: 4795
            }
        ] as any as InputTimeSeriesData;

        const layoutData = {
            topMargin: 0,
            responsive: true,
            subplots: {
                columns: 2,
                distinctColumn: "area_id",
                heightPerRow: 100,
                subplotsPerPage: 99,
                rows: 2
            },
            yAxisFormat: ".0f"
        };

        const expectedData = [
            {
                name: "Chitipa",
                plotType: null,
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [2116, 2663],
                xaxis: "x1",
                yaxis: "y1",
                type: "scatter",
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.HIGHLIGHT.BASE)
                    }
                },
                hovertemplate: Array(2).fill("%{x}, %{y}<br>Northern/Chitipa<extra></extra>")
            },
            {
                name: "Karonga",
                plotType: null,
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [5673, 7674],
                xaxis: "x2",
                yaxis: "y2",
                type: "scatter",
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.HIGHLIGHT.BASE)
                    }
                },
                hovertemplate: Array(2).fill("%{x}, %{y}<br>Northern/Karonga<extra></extra>")
            },
            {
                name: "Chitipa",
                plotType: null,
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [4555, 4795],
                xaxis: "x3",
                yaxis: "y3",
                type: "scatter",
                line: {color: PlotColours.NORMAL.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.NORMAL.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.NORMAL.BASE)
                    }
                },
                hovertemplate: Array(2).fill("%{x}, %{y}<br>Southern/Chitipa<extra></extra>")
            },
        ];

        const dataByArea = getChartDataByArea(chartData);
        const timePeriods = chartData.map(dataPoint => dataPoint.time_period).sort() || [];

        it("can build scatter points from data", () => {
            const data = getScatterPointsFromAreaIds(dataByArea, Language.en);
            expect(data).toStrictEqual(expectedData)
        });

        it("can build layout data", () => {
            const layout = getLayoutFromData(dataByArea, layoutData, timePeriods);

            expect(layout.annotations).toStrictEqual([
                {
                    text: "Chitipa (MWI_4_1_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x1 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y1 domain"
                },
                {
                    text: "Karonga (MWI_4_2_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x2 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y2 domain"
                },
                {
                    text: "Chitipa (MWI_4_3_demo)",
                    textfont: {},
                    showarrow: false,
                    x: 0.5,
                    xanchor: "middle",
                    xref: "x3 domain",
                    y: 1.1,
                    yanchor: "middle",
                    yref: "y3 domain"
                }
            ]);

            expect(layout.xaxis1).toStrictEqual(expectedXAxis);
            expect(layout.xaxis2).toStrictEqual(expectedXAxis);
            expect(layout.xaxis3).toStrictEqual(expectedXAxis);

            expectYAxis(1, 0.7, layout.yaxis1);
            expectYAxis(1, 0.7, layout.yaxis2);
            expectYAxis(0.5, 0.2, layout.yaxis3);
        });
    });

    describe("tooltips", () => {
        it("evaluates single-line tooltips for area with empty hierarchy", async () => {
            const dataNullHierarchy = [
                {
                    area_id: "MWI_1_1_demo",
                    area_name: "Malawi",
                    area_hierarchy: "",
                    time_period: "2011 Q4",
                    value: 2116
                },
                {
                    area_id: "MWI_1_1_demo",
                    area_name: null,
                    area_hierarchy: "Northern/Chitipa",
                    time_period: "2012 Q4",
                    value: 4663
                }
            ] as any as InputTimeSeriesData;

            const template = getTooltipTemplate(dataNullHierarchy, "", null, Language.en);

            expect(template).toStrictEqual(["%{x}, %{y}<extra></extra>", "%{x}, %{y}<extra></extra>"]);
        });

        it("adds tooltip and styling when values are missing", async () => {
            // In this data we have 4 points
            // Point 2, 3 and 4 are missing data
            // Large change between 2 and 3 and 3 and 4
            const chartData = [
                {
                    area_id: "MWI_1_1_demo",
                    area_name: "Malawi",
                    area_hierarchy: "Northern/Chitipa",
                    time_period: "2011 Q4",
                    value: 2116,
                    missing_ids: []
                },
                {
                    area_id: "MWI_1_1_demo",
                    area_name: "Malawi",
                    area_hierarchy: "Northern/Chitipa",
                    time_period: "2012 Q4",
                    value: 2116,
                    missing_ids: ["MWI_1_1_demo"]
                },
                {
                    area_id: "MWI_1_1_demo",
                    area_name: "Malawi",
                    area_hierarchy: "Northern/Chitipa",
                    time_period: "2013 Q4",
                    value: 4663,
                    missing_ids: ["MWI_1_2_demo", "MWI_1_3_demo"]
                },
                {
                    area_id: "MWI_1_1_demo",
                    area_name: "Malawi",
                    area_hierarchy: "Northern/Chitipa",
                    time_period: "2014 Q4",
                    value: 5567,
                    missing_ids: ["MWI_1_2_demo", "MWI_1_3_demo", "MWI_1_4_demo", "MWI_1_5_demo", "MWI_1_6_demo"]
                }
            ] as any as InputTimeSeriesData;

            const template = getTooltipTemplate(chartData, "Northern/Chitipa", null, Language.en);

            expect(template).toStrictEqual([
                "%{x}, %{y}<br>Northern/Chitipa<extra></extra>",
                "%{x}, %{y}<br>Northern/Chitipa<br>This value is missing from the uploaded data<extra></extra>",
                "%{x}, %{y}<br>Northern/Chitipa<br>Aggregate value missing data for 2 regions<extra></extra>",
                "%{x}, %{y}<br>Northern/Chitipa<br>Aggregate value missing data for 5 regions<extra></extra>"
            ]);

            const dataByArea = getChartDataByArea(chartData);
            const points = getScatterPointsFromAreaIds(dataByArea, Language.en);

            expect(points).toStrictEqual([
                {
                    name: "Malawi",
                    plotType: null,
                    showlegend: false,
                    x: ["2011 Q4", "2012 Q4"],
                    y: [2116, 2116],
                    xaxis: "x1",
                    yaxis: "y1",
                    type: "scatter",
                    line: {color: PlotColours.NORMAL.BASE, dash: "solid"},
                    marker: {
                        color: [PlotColours.NORMAL.BASE, PlotColours.NORMAL.MISSING],
                        line: {
                            width: 0.5,
                            color: [PlotColours.NORMAL.BASE, PlotColours.NORMAL.BASE]
                        }
                    },
                    hovertemplate: [
                        "%{x}, %{y}<br>Northern/Chitipa<extra></extra>",
                        "%{x}, %{y}<br>Northern/Chitipa<br>This value is missing from the uploaded data<extra></extra>",
                    ]
                },
                {
                    name: "Malawi",
                    plotType: null,
                    showlegend: false,
                    x: ["2012 Q4", "2013 Q4"],
                    y: [2116, 4663],
                    xaxis: "x1",
                    yaxis: "y1",
                    type: "scatter",
                    line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                    marker: {
                        color: [PlotColours.HIGHLIGHT.MISSING, PlotColours.HIGHLIGHT.MISSING],
                        line: {
                            width: 0.5,
                            color: [PlotColours.HIGHLIGHT.BASE, PlotColours.HIGHLIGHT.BASE]
                        }
                    },
                    hovertemplate: [
                        "%{x}, %{y}<br>Northern/Chitipa<br>This value is missing from the uploaded data<extra></extra>",
                        "%{x}, %{y}<br>Northern/Chitipa<br>Aggregate value missing data for 2 regions<extra></extra>"
                    ]
                },
                {
                    name: "Malawi",
                    plotType: null,
                    showlegend: false,
                    x: ["2013 Q4", "2014 Q4"],
                    y: [4663, 5567],
                    xaxis: "x1",
                    yaxis: "y1",
                    type: "scatter",
                    line: {color: PlotColours.NORMAL.BASE, dash: "solid"},
                    marker: {
                        color: [PlotColours.HIGHLIGHT.MISSING, PlotColours.NORMAL.MISSING],
                        line: {
                            width: 0.5,
                            color: [PlotColours.HIGHLIGHT.BASE, PlotColours.NORMAL.BASE]
                        }
                    },
                    hovertemplate: [
                        "%{x}, %{y}<br>Northern/Chitipa<br>Aggregate value missing data for 2 regions<extra></extra>",
                        "%{x}, %{y}<br>Northern/Chitipa<br>Aggregate value missing data for 5 regions<extra></extra>"
                    ]
                },
            ]);
        });
    });

    describe("format expression as latex", () => {
        const idTolabelMap = new Map<string, string>([
            ["anc_prevalence", "ANC Prevalence"],
            ["anc_total_pos", "ANC total pos"],
            ["anc_status", "ANC status"],
        ]);

        it ("can format an expression as a latex string", () => {
            const expectedAncPrev = `\\htmlClass{hoverable}{\\htmlId{anc_prevalence}{\\textcolor{${PlotColours.NORMAL.BASE}}{\\text{ANC Prevalence}}}}`
            expect(expressionToString("anc_prevalence", idTolabelMap))
                .toStrictEqual(expectedAncPrev)

            const expectedAncTotalPos = `\\htmlClass{hoverable}{\\htmlId{anc_total_pos}{\\textcolor{#1c7e19}{\\text{ANC total pos}}}}`
            expect(expressionToString("anc_total_pos", idTolabelMap))
                .toStrictEqual(expectedAncTotalPos)

            const addEx = {
                op: Operator.Add,
                a: "anc_prevalence",
                b: "anc_total_pos",
            }
            expect(expressionToString(addEx, idTolabelMap))
                .toStrictEqual(`${expectedAncPrev}\\text{ + }${expectedAncTotalPos}`)

            const eqEx = {
                op: Operator.Eq,
                a: "anc_prevalence",
                b: "anc_total_pos",
            }
            expect(expressionToString(eqEx, idTolabelMap))
                .toStrictEqual(`${expectedAncPrev}=${expectedAncTotalPos}`)

            const divideEx = {
                op: Operator.Divide,
                a: "anc_prevalence",
                b: "anc_total_pos",
            }
            expect(expressionToString(divideEx, idTolabelMap))
                .toStrictEqual(`\\frac{${expectedAncPrev}}{${expectedAncTotalPos}}`)

            const nestedEx = {
                op: Operator.Divide,
                a: addEx,
                b: addEx
            }
            expect(expressionToString(nestedEx, idTolabelMap))
                .toStrictEqual(`\\frac{${expectedAncPrev}\\text{ + }${expectedAncTotalPos}}{${expectedAncPrev}\\text{ + }${expectedAncTotalPos}}`)

            expect(expressionToString("unkn", idTolabelMap))
                .toStrictEqual(`\\htmlClass{hoverable}{\\htmlId{unkn}{\\textcolor{${PlotColours.NORMAL.BASE}}{\\text{unkn}}}}`)
        })
    });

    describe("can build layout and scatter points for time series by indicator groups", () => {
        // Test data set for four areas, where number of columns is 2, so 2 rows will be required.
        // Areas 1 to 3 have two data points. The first two areas' diff between first and second points violates
        // threshold so these will be highlighted, the third area does not.
        // The fourth area has only 1 data point
        const chartData = [
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                area_level: 4,
                quarter: "Q4",
                time_period: "2011 Q4",
                plot: "anc_status",
                value: 2116,
                page: 1
            },
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                area_level: 4,
                quarter: "Q4",
                time_period: "2012 Q4",
                plot: "anc_status",
                value: 2663,
                page: 1
            },
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                area_level: 4,
                quarter: "Q4",
                time_period: "2011 Q4",
                plot: "anc_known_pos",
                value: 4555,
                page: 1
            },
            {
                area_id: "MWI_4_1_demo",
                area_name: "Chitipa",
                area_hierarchy: "Northern/Chitipa",
                area_level: 4,
                quarter: "Q4",
                time_period: "2012 Q4",
                plot: "anc_known_pos",
                value: 4795,
                page: 1
            },
        ] as any as InputTimeSeriesData;

        const plotNameMap = new Map<string, string>([
            ["anc_status", "ANC status"],
            ["anc_known_pos", "ANC known pos"]
        ])

        const layoutData = {
            isModal: true,
            margin: {l: 40, r: 40, t: 10, b: 40},
            timeSeriesPlotLabels: plotNameMap,
            yAxisFormat: [".0f", ","],
            subplots: {
                columns: 2,
                distinctColumn: "plot",
                rows: 1,
                indicators: [["anc_status"], ["anc_status", "anc_known_pos"]]
            },
        };

        const expectedData = [
            {
                name: "ANC status",
                plotType: "anc_status",
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [2116, 2663],
                xaxis: "x1",
                yaxis: "y1",
                type: "scatter",
                line: {color: PlotColours.HIGHLIGHT.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(PlotColours.HIGHLIGHT.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(PlotColours.HIGHLIGHT.BASE)
                    }
                },
                hovertemplate: Array(2).fill("ANC status<br>%{x}, %{y}<br>Northern/Chitipa<extra></extra>")
            },
            {
                name: "ANC status",
                plotType: "anc_status",
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [2116, 2663],
                xaxis: "x2",
                yaxis: "y2",
                type: "scatter",
                line: {color: timeSeriesFixedColours.get("anc_status")!.BASE, dash: "solid"},
                marker: {
                    color: Array(2).fill(timeSeriesFixedColours.get("anc_status")!.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(timeSeriesFixedColours.get("anc_status")!.BASE)
                    }
                },
                hovertemplate: Array(2).fill("ANC status<br>%{x}, %{y}<br>Northern/Chitipa<extra></extra>")
            },
            {
                name: "ANC known pos",
                plotType: "anc_known_pos",
                showlegend: false,
                x: ["2011 Q4", "2012 Q4"],
                y: [4555, 4795],
                xaxis: "x2",
                yaxis: "y2",
                type: "scatter",
                line: {color: timeSeriesFixedColours.get("anc_known_pos")!.BASE, dash: "dash"},
                marker: {
                    color: Array(2).fill(timeSeriesFixedColours.get("anc_known_pos")!.BASE),
                    line: {
                        width: 0.5,
                        color: Array(2).fill(timeSeriesFixedColours.get("anc_known_pos")!.BASE)
                    }
                },
                hovertemplate: Array(2).fill("ANC known pos<br>%{x}, %{y}<br>Northern/Chitipa<extra></extra>")
            },
        ] as any

        const dataByIndicatorGroup = getChartDataByIndicatorGroup(chartData, layoutData.subplots.indicators);
        const timePeriods = chartData.map(dataPoint => dataPoint.time_period).sort() || [];

        it("can get chart data split by indicator group", () => {
            expect(Object.keys(dataByIndicatorGroup)).toStrictEqual(["0", "1"]);

            const firstGroupPlotTypes = Array.from(new Set(dataByIndicatorGroup[0].map(obj => obj.plot)))
            expect(firstGroupPlotTypes).toStrictEqual(["anc_status"])
            const secondGroupPlotTypes = Array.from(new Set(dataByIndicatorGroup[1].map(obj => obj.plot)))
            expect(secondGroupPlotTypes).toStrictEqual(["anc_status", "anc_known_pos"])
        });

        it("can build scatter points from data", () => {
            const data = getScatterPointsFromIndicator(layoutData.subplots.indicators, dataByIndicatorGroup,
                plotNameMap, Language.en);
            expect(data).toStrictEqual(expectedData)
        });

        it("can build layout data", () => {
            const layout = getLayoutFromData(dataByIndicatorGroup, layoutData, timePeriods);

            expect(Object.keys(layout)).toStrictEqual([
                "margin", "dragmode", "grid", "yaxis1", "xaxis1", "yaxis2", "xaxis2"
            ]);
            expect(layout.margin).toStrictEqual({l: 40, r: 40, t: 10, b: 40});
            expect(layout.dragmode).toBe(false);
            expect(layout.grid).toStrictEqual({
                columns: 2,
                rows: 1,
                pattern: "independent",
                xgap: 0.25,
                ygap: 0.4,
            });

            expect(layout.xaxis1).toStrictEqual(expectedXAxis);
            expect(layout.xaxis2).toStrictEqual(expectedXAxis);

            expectYAxis(1, 0.4, layout.yaxis1);
            expectYAxis(1, 0.4, layout.yaxis2, ",");
        });
    });
});
