import i18next from "i18next";
import { InputTimeSeriesData, InputTimeSeriesRow } from "../../../generated";
import { Dict } from "../../../types";
import { Annotations } from "plotly.js-basic-dist"

export function numeralJsToD3format(numeralJsFormat: string) {
    // Convert hintr metadata format (which are numeralJs style) to d3 format to be used by Plotly
    // We currently support only numeric, large number, and percentage formats, and will return 
    // empty string for any other formats received, for default formatting in Plotly.

    // The first part of this regex (before the |) captures formats with decimal precision and optional percentage
    // The second part captures format with thousands separator for large integers
    const regex = /^0(\.0+)?(%)?$|^0(,0)$/; //This will always return four matches

    const match = numeralJsFormat.match(regex);
    if (match === null) {
        return "";
    }

    if (match[3] !== undefined) {
        return ",";
    }

    const decPl = match[1] == undefined ? 0 : match[1].length - 1;
    const percent = match[2] !== undefined;
    const suffix = percent ? "%" : "f";
    return `.${decPl}${suffix}`;
}

export const drawConfig = {
    responsive: true,
    scrollZoom: false,
    modeBarButtonsToRemove: [
        'zoom2d',
        'pan2d',
        'select2d',
        'lasso2d',
        'autoScale2d',
        'resetScale2d',
        'zoomIn2d',
        'zoomOut2d'
    ]
};

const translate = (word: string, currentLanguage: string, args: any = null) => {
    return i18next.t(word, {...args, lng: currentLanguage})
}

export const getTooltipTemplate = (plotData: (InputTimeSeriesRow | null)[], areaHierarchy: string,
                                   indicator: string | null, currentLanguage: string) => {
    const hierarchyText = areaHierarchy ? "<br>" + areaHierarchy : "";
    const tooltip = "%{x}, %{y}" + hierarchyText;
    const indicatorText = indicator ? indicator + "<br>" : ""
    return plotData.map((entry: InputTimeSeriesRow | null) => {
        let missingIdsText = "";
        if (entry?.missing_ids?.length) {
            // If the area ID matches the missing_id then this is a synthetic value we have appended
            // rather than an aggregate with some missing data. Show this with a slightly different
            // message
            if (entry.missing_ids.length == 1 && entry.missing_ids[0] == entry.area_id) {
                missingIdsText = "<br>" + translate("timeSeriesMissingValue", currentLanguage);
            } else {
                missingIdsText = "<br>" + translate("timeSeriesMissingAggregate", currentLanguage,
                    {count: entry.missing_ids.length});
            }
        }
        // Empty <extra></extra> tag removes the part of the hover where trace name is displayed in
        // contrasting colour. See https://plotly.com/python/hover-text-and-formatting/
        return indicatorText + tooltip + missingIdsText + "<extra></extra>";
    })
}

export const PlotColours = Object.freeze({
    HIGHLIGHT: {
        MISSING: "#ffd6d6",
        BASE: "#ff3333"
    },
    NORMAL: {
        MISSING: "#dcdcdc",
        BASE: "#333333"
    }
});

type PointMetadata = {
    pointName: string
    areaHierarchy: string,
    plotType: string | null
    colours: typeof PlotColours.HIGHLIGHT,
    isFirstPointHighlight: boolean
}

const getScatterPoints = (plotData: (InputTimeSeriesRow | null)[], pointMetadata: PointMetadata, index: number, currentLanguage: string) => {
    const {colours, isFirstPointHighlight } = pointMetadata;
    const markerFillColors = plotData.map((x, i) => {
        if (isFirstPointHighlight && i === 0) {
            return x?.missing_ids?.length ? PlotColours.HIGHLIGHT.MISSING : PlotColours.HIGHLIGHT.BASE;
        }
        return x?.missing_ids?.length ? colours.MISSING : colours.BASE;
    });
    const markerOutlineColors = plotData.map((_x, i) => {
        return isFirstPointHighlight && i === 0 ? PlotColours.HIGHLIGHT.BASE : colours.BASE;
    });
    const indicatorLabel = pointMetadata.plotType ? pointMetadata.pointName : null
    const points: any = {
        name: pointMetadata.pointName,
        showlegend: false,
        x: plotData.map(x => x?.time_period),
        y: plotData.map(x => x?.value),
        xaxis: `x${index+1}`, yaxis: `y${index+1}`,
        type: "scatter",
        marker: {
            color: markerFillColors,
            line: { width: 0.5, color: markerOutlineColors },
        },
        line: { color: colours.BASE },
        hovertemplate: getTooltipTemplate(plotData, pointMetadata.areaHierarchy, indicatorLabel, currentLanguage)
    }
    return points
};

type PointInfo = {
    isHighlight: boolean,
    point: InputTimeSeriesRow
};

type LineSegmentsInfo = {
    isHighlight: boolean,
    points: InputTimeSeriesRow[]
};

export const getScatterPointsFromAreaIds = (dataByArea: Dict<InputTimeSeriesData>, currentLanguage: string) => {
    return Object.keys(dataByArea).reduce((r, id, index) => {
        const areaData = dataByArea[id];
        const scatterPoints = getScatterPointsWithHighlight(areaData, index, false, null, currentLanguage)
        return [...r, ...scatterPoints]
    }, [] as any[]);
};

const getScatterPointsWithHighlight = (data: InputTimeSeriesData, groupIndex: number, multipleIndicator: boolean,
                                       plotNameMap: Map<string, string> | null, currentLanguage: string) => {
    const pointsInfo: PointInfo[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i === data.length - 1) {
            pointsInfo.push({
                isHighlight: pointsInfo.at(-1)?.isHighlight ?? false,
                point: data[i]
            });
            continue;
        }
        const currPointValue = data[i].value;
        const nextPointValue = data[i + 1].value;
        const isNextLineSegmentHighlighted = ((currPointValue != null && nextPointValue != null && nextPointValue > 0)
            && (nextPointValue > 1.25 * currPointValue || nextPointValue < 0.75 * currPointValue));
        pointsInfo.push({isHighlight: isNextLineSegmentHighlighted, point: data[i]});
    }
    let isPreviousLineHighlight = pointsInfo[0].isHighlight;
    const lineSegmentsInfo: LineSegmentsInfo[] = [{
        isHighlight: isPreviousLineHighlight, points: []
    }];
    for (let i = 0; i < pointsInfo.length; i++) {
        const { isHighlight, point } = pointsInfo[i];
        lineSegmentsInfo.at(-1)!.points.push(point);
        if (isHighlight !== isPreviousLineHighlight) {
            lineSegmentsInfo.push({ isHighlight, points: [point] });
        }
        isPreviousLineHighlight = isHighlight;
    }
    return lineSegmentsInfo.map(({isHighlight, points}, lineNum) => {
        const plotLabel = multipleIndicator ? plotNameMap?.get(data[0].plot!) ?? data[0].plot! : data[0].area_name
        const pointMetadata = {
            pointName: plotLabel,
            areaHierarchy: data[0].area_hierarchy,
            plotType: multipleIndicator ? data[0].plot : null,
            colours: isHighlight ? PlotColours.HIGHLIGHT : PlotColours.NORMAL,
            // Need to make sure that the first point in a non highlighted segment is red following a highlighted
            // segment. In the case lineNum = 0, prevHighlight will be false anyway so our special case won't
            // be triggered
            isFirstPointHighlight: isHighlight ? false : lineSegmentsInfo[Math.max(lineNum - 1, 0)].isHighlight
        }
        return getScatterPoints(points, pointMetadata, groupIndex, currentLanguage);
    });
}

const getScatterPointsNoHighlight = (data: InputTimeSeriesData, groupIndex: number,
                                     plotNameMap: Map<string, string>,
                                     currentLanguage: string) => {
    const name = plotNameMap.get(data[0].plot!) ?? data[0].plot!;
    const pointMetadata = {
        pointName: name,
        areaHierarchy: data[0].area_hierarchy,
        plotType: data[0].plot,
        colours: timeSeriesFixedColours.get(data[0].plot!) ?? PlotColours.NORMAL,
        isFirstPointHighlight: false
    }
    return getScatterPoints(data, pointMetadata, groupIndex, currentLanguage);
}

export const getScatterPointsFromIndicator = (indicatorGroups: string[][], dataByGroup: Dict<InputTimeSeriesData>,
                                              plotNameMap: Map<string, string>, currentLanguage: string) => {
    return indicatorGroups.flatMap((group, groupIndex) => {
        return group.reduce((r, indicatorName) => {
            const groupData = dataByGroup[groupIndex];
            const indicatorData = groupData.filter(row => row.plot === indicatorName)
            if (groupIndex == 0) {
                const scatterPoints = getScatterPointsWithHighlight(indicatorData, groupIndex, true, plotNameMap, currentLanguage)
                return [...r, ...scatterPoints]
            } else {
                const scatterPoints = getScatterPointsNoHighlight(indicatorData, groupIndex, plotNameMap, currentLanguage)
                return [...r, scatterPoints]
            }
        },  [] as any[]);
    });
};

export type Layout = Record<string, any>
export interface HintPlotlyAnnotation extends Annotations {
    areaId: string,
    plotType: string
}

export const getChartDataByArea = (chartData: InputTimeSeriesData): Dict<InputTimeSeriesData> => {
    return chartData.reduce((obj, data) => {
        obj[data.area_id] = obj[data.area_id] || [];
        obj[data.area_id].push(data);
        return obj;
    }, {} as Record<string, InputTimeSeriesData>);
}

export const getChartDataByIndicatorGroup = (chartData: InputTimeSeriesData, plotGroups: string[][]): Dict<InputTimeSeriesData> => {
    return chartData.reduce((obj, data) => {
        const indicatorGroupIdx = plotGroups.findIndex((group: string[]) => group.includes(data.plot!))
        obj[indicatorGroupIdx] = obj[indicatorGroupIdx] || [];
        obj[indicatorGroupIdx].push(data);
        return obj;
    }, {} as Record<string, InputTimeSeriesData>);
}

export const getLayoutFromData = (dataByArea: Dict<InputTimeSeriesData>, layout: Layout, timePeriods: string[]) => {
    const baseLayout: Record<string, any> = {
        margin: layout.margin ?? {t: 32},
        dragmode: false,
        grid: {
            columns: layout.subplots.columns,
            rows: layout.subplots.rows,
            pattern: 'independent',
            xgap: layout.subplots.xgap ?? 0.25,
            ygap: 0.4
        }
    };

    const plotIds = Object.keys(dataByArea);

    if (layout.subplots.distinctColumn == "area_id") {
        baseLayout.annotations = plotIds.map((id, index) => {
            return {
                x: 0.5, y: 1.1,
                xanchor: "middle", yanchor: "middle",
                xref: `x${index+1} domain`, yref: `y${index+1} domain`,
                text: `${dataByArea[id][0].area_name} (${id})`,
                showarrow: false, textfont: {}
            }
        })

        // For distinct area column, there will always be 1 plot type so we can get the first
        const plotType = dataByArea[plotIds[0]][0].plot;
        if (plotType && timeSeriesExpandedViews.has(plotType)) {
            baseLayout.annotations = [
                ...baseLayout.annotations,
                ...plotIds.map((id, index) => {
                    return {
                        x: 1.1, y: 1.1,
                        xanchor: "right", yanchor: "middle",
                        xref: `x${index+1} domain`, yref: `y${index+1} domain`,
                        text: `<span>⇱</span>`,
                        textangle: "90",
                        hovertext: "Expand plot",
                        showarrow: false, textfont: {},
                        captureevents: true,
                        areaId: id,
                        plotType: plotType
                    }
                })
            ]
        }
    }

    const subPlotHeight = 1 / (layout.subplots?.rows || 1) * 0.6;
    const firstXAxisVal = timePeriods[0];
    const lastXAxisVal = timePeriods[timePeriods.length - 1];

    for (let i = 0; i < plotIds.length; i++) {
        const row = Math.floor(i / layout.subplots.columns);
        const maxOfData = Math.max(...dataByArea[plotIds[i]].map(d => d.value || 0));
        const yStart = 1 - (row / layout.subplots.rows);
        const tickFormat = typeof layout.yAxisFormat === "string" ? layout.yAxisFormat : layout.yAxisFormat[i]
        baseLayout[`yaxis${i + 1}`] = {
            zeroline: false,
            tickformat: tickFormat,
            tickfont: {color: "grey"},
            domain: [yStart, yStart - subPlotHeight],
            range: [-maxOfData * 0.1, maxOfData * 1.1],
            type: "linear"
        };
        baseLayout[`xaxis${i + 1}`] = {
            zeroline: false,
            tickvals: [firstXAxisVal, lastXAxisVal],
            tickfont: {color: "grey"},
            autorange: true,
            type: "category"
        };
    }
    return baseLayout;
}

export interface TimeSeriesExpandedConfig {
    plots: string[][]
    formula: Expression
}

export enum Operator {
    Divide = "\\frac",
    Add = "\\text{ + }",
    Eq = "="
}

export interface Expression {
    op: Operator,
    a: Expression | string,
    b: Expression | string
}

export const expressionToString = (expression: Expression | string, plotIdToLabels: Map<string, string>): string => {
    if (typeof expression === "string") {
        const colour = timeSeriesFixedColours.get(expression) ?? PlotColours.NORMAL;
        const label = plotIdToLabels.get(expression) ?? expression;
        return `\\textcolor{${colour.BASE}}{\\text{${label}}}`;
    } else if (expression.op === Operator.Divide) {
        return `${expression.op}{${expressionToString(expression.a, plotIdToLabels)}}{${expressionToString(expression.b, plotIdToLabels)}}`
    } else {
        return expressionToString(expression.a, plotIdToLabels) + expression.op + expressionToString(expression.b, plotIdToLabels);
    }
}

export const timeSeriesExpandedViews = new Map<string, TimeSeriesExpandedConfig>([
    ["anc_prevalence", {
        plots: [["anc_prevalence"], ["anc_total_pos", "anc_status"], ["anc_known_pos", "anc_tested_pos", "anc_tested", "anc_known_neg"]],
        formula: {
            op: Operator.Eq,
            a: "anc_prevalence",
            b: {
                op: Operator.Eq,
                a: {
                    op: Operator.Divide,
                    a: "anc_total_pos",
                    b: "anc_status"
                },
                b: {
                    op: Operator.Divide,
                    a: {
                        op: Operator.Add,
                        a: "anc_known_pos",
                        b: "anc_tested_pos"
                    },
                    b: {
                        op: Operator.Add,
                        a: "anc_tested",
                        b: "anc_known_neg"
                    }
                }
            }
        }
    }]
]);

export const timeSeriesFixedColours = new Map<string, typeof PlotColours.NORMAL>([
    ["anc_total_pos", {BASE: "#4daf4a", MISSING: "#dcdcdc"}],
    ["anc_status", {BASE: "#377eb8", MISSING: "#dcdcdc"}],
    ["anc_known_pos", {BASE: "#005500", MISSING: "#dcdcdc"}],
    ["anc_tested_pos", {BASE: "#1c7e19", MISSING: "#dcdcdc"}],
    ["anc_tested", {BASE: "#064d87", MISSING: "#dcdcdc"}],
    ["anc_known_neg", {BASE: "#569dd7", MISSING: "#dcdcdc"}],
])
