import {TableData} from "../../../store/plotData/plotData";
import {FilterSelection, PlotName,} from "../../../store/plotSelections/plotSelections";
import {
    CalibrateDataResponse,
    FilterOption,
    IndicatorMetadata,
    InputComparisonResponse,
    TableMetadata
} from "../../../generated";
import {formatOutput} from "../utils";
import i18next from "i18next";
import {Language} from "../../../store/translations/locales";
import {ITooltipComp, ITooltipParams, ValueFormatterParams, ValueGetterParams} from "ag-grid-community";
import DifferenceColumnRenderer from "./DifferenceColumnRenderer.vue";

export interface TableHeaderDef {
    columnLabel: string
    columnField: string
}

export const DIFFERENCE_POSITIVE_COLOR = "rgb(55, 126, 184)";
export const DIFFERENCE_NEGATIVE_COLOR = "rgb(228, 26, 28)";

export const getTableValues = (plot: PlotName, dataSource: string | null, disaggregateColumn: string, row: TableData[0]) => {
    if (plot === "table") {
        const r = row as CalibrateDataResponse["data"][0];
        return {
            [`mean_${r[disaggregateColumn]}`]: r.mean,
            [`upper_${r[disaggregateColumn]}`]: r.upper,
            [`lower_${r[disaggregateColumn]}`]: r.lower,
        }
    } else if (plot === "inputComparisonTable") {
        if (dataSource === "anc") {
            const r = row as InputComparisonResponse["data"]["anc"][0];
            return {
                [`spectrum_${r[disaggregateColumn]}`]: r.value_spectrum,
                [`naomi_${r[disaggregateColumn]}`]: r.value_naomi,
                [`difference_${r[disaggregateColumn]}`]: (r.value_naomi != null && r.value_spectrum != null) ? r.value_naomi - r.value_spectrum : null,
            };
        } else {
            const r = row as InputComparisonResponse["data"]["art"][0];
            return {
                [`spectrum_adjusted_${r[disaggregateColumn]}`]: r.value_spectrum_adjusted,
                [`spectrum_reported_${r[disaggregateColumn]}`]: r.value_spectrum_reported,
                [`spectrum_reallocated_${r[disaggregateColumn]}`]: r.value_spectrum_reallocated,
                [`naomi_${r[disaggregateColumn]}`]: r.value_naomi,
                [`difference_${r[disaggregateColumn]}`]: r.difference,
                [`difference_ratio_${r[disaggregateColumn]}`]: r.difference_ratio
            };
        }
    } else {
        throw new Error(`Unreachable, if seeing this you're missing data type '${plot}' in table data prep util.`)
    }
}

export const getColumnDefs = (plot: PlotName, dataSource: string | null, indicatorMetadata: IndicatorMetadata,
                              tableMetadata: TableMetadata, filterSelections: FilterSelection[],
                              headerDefs: TableHeaderDef[], currentLanguage: Language) => {
    const columnId = tableMetadata.column[0];
    const columnSelection = filterSelections.find((f: FilterSelection) => f.filterId == columnId);
    const baseColumns = headerDefs.map((header: TableHeaderDef) => {
        return {
            headerName: header.columnLabel,
            field: header.columnField,
            minWidth: 125,
            // Override default filter type
            filter: "agTextColumnFilter",
            pinned: "left"
        }
    })
    let dataColumns: any[] = []
    if (!columnSelection) {
        return baseColumns;
    }
    if (plot === "table") {
        dataColumns = columnSelection.selection.map((selection: FilterOption) => {
            return {
                headerName: selection.label,
                valueGetter: getValue("mean", selection.id),
                valueFormatter: getFormat(selection.id, filterSelections, indicatorMetadata)
            }
        });
    } else if (plot === "inputComparisonTable" && dataSource === "anc") {
        const valueKeys = ["spectrum", "naomi", "difference"];
        dataColumns = columnSelection.selection.map((selection: FilterOption) => {
            const childrenColumns = valueKeys.map(key => {
                return {
                    headerName: i18next.t(key, {lng: currentLanguage}),
                    colId: selection.id,
                    valueGetter: getValue(key, selection.id),
                    valueFormatter: (params: ValueFormatterParams) => {
                        // Format actual values (including 0) but return null if data is missing
                        if (params.value != null) {
                            return formatOutput(params.value, indicatorMetadata.format, indicatorMetadata.scale, indicatorMetadata.accuracy)
                        } else {
                            return null
                        }
                    },
                    cellRenderer: key === "difference" ? DifferenceColumnRenderer : null
                }
            })
            return {
                headerName: selection.label,
                colId: selection.id,
                children: childrenColumns
            }
        });
    } else if (plot === "inputComparisonTable" && dataSource === "art") {
        const valueKeys = ["spectrum_reported", "spectrum_adjusted", "naomi", "difference", "difference_ratio"];
        dataColumns = columnSelection.selection.map((selection: FilterOption) => {
            const childrenColumns = valueKeys.map(key => {
                return {
                    headerName: i18next.t(key, {lng: currentLanguage}),
                    colId: selection.id,
                    minWidth: 100,
                    sortable: false,
                    filter: false,
                    valueGetter: getValue(key, selection.id),
                    valueFormatter: (params: ValueFormatterParams) => {
                        if (key === "difference_ratio") {
                            return formatOutput(params.value, "0.00", null, null)
                        } else if (params.value != null) {
                            // Format actual values (including 0) but return null if data is missing
                            return formatOutput(params.value, indicatorMetadata.format, indicatorMetadata.scale, indicatorMetadata.accuracy)
                        } else {
                            return null
                        }
                    },
                    cellRenderer: key === "difference" ? DifferenceColumnRenderer : null,
                    headerTooltip: key === "difference" || key === "difference_ratio" ? i18next.t(`tableArtTooltip${key}`) : null,
                    tooltipValueGetter: key === "spectrum_adjusted" ? inputComparisonTooltipCallback : null,
                    tooltipComponent: InputComparisonTooltip
                }
            })
            return {
                headerName: selection.label,
                colId: selection.id,
                children: childrenColumns,
            }
        });
    }
    return [
        ...baseColumns,
        ...dataColumns
    ];
}

export class InputComparisonTooltip implements ITooltipComp {
    eGui: any;
    init(params: ITooltipParams) {
        const eGui = (this.eGui = document.createElement('div'));
        eGui.classList.add('ag-tooltip');
        eGui.innerHTML = params.value;
    }

    getGui() {
        return this.eGui;
    }
}


const inputComparisonTooltipCallback = (params: ITooltipParams) => {
    const column = params.column;
    if (!isColumnWithParent(column)) {
        return null
    }
    const groupId = column.parent.providedColumnGroup.colGroupDef.colId;
    if (!groupId) {
        return null
    }
    const reallocation = params.data[`spectrum_reallocated_${groupId}`];
    const formattedRelocation = formatOutput(reallocation, "0,0", null, null);
    return `<div><b>${i18next.t("spectrumReallocation")}</b> ${formattedRelocation}</div>`

};

function isColumnWithParent(column: any): column is { parent: any } {
    return column && 'parent' in column;
}

const getValue = (key: string, disaggregation: string) => {
    return (params: ValueGetterParams) => params.data[`${key}_${disaggregation}`];
};

const getFormat = (disaggregation: string, filterSelections: FilterSelection[], metadata: IndicatorMetadata) => {
    const formatValue = (value: number) => {
        return formatOutput(value, metadata.format, metadata.scale, metadata.accuracy);
    };
    return (params: any) => {
        const sexSelections = filterSelections
            .find(f => f.stateFilterId === "sex")?.selection
            .map((op: FilterOption)  => op.id);
        if (!sexSelections || !sexSelections.includes(disaggregation)) return "";
        const mean = formatValue(params.value);
        const lower = formatValue(params.data["lower_" + disaggregation]);
        const upper = formatValue(params.data["upper_" + disaggregation]);
        return `${mean} (${lower} - ${upper})`;
    };
};
