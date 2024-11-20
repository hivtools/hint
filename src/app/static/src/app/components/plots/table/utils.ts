import {PlotData} from "../../../store/plotData/plotData";
import {FilterSelection, PlotName,} from "../../../store/plotSelections/plotSelections";
import {
    CalibrateDataResponse,
    FilterOption,
    IndicatorMetadata,
    InputComparisonData,
    TableMetadata
} from "../../../generated";
import {formatOutput} from "../utils";
import i18next from "i18next";
import {Language} from "../../../store/translations/locales";
import {ValueFormatterParams, ValueGetterParams} from "ag-grid-community";
import DifferenceColumnRenderer from "./DifferenceColumnRenderer.vue";

export interface TableHeaderDef {
    columnLabel: string
    columnField: string
}

export const DIFFERENCE_POSITIVE_COLOR = "rgb(55, 126, 184)";
export const DIFFERENCE_NEGATIVE_COLOR = "rgb(228, 26, 28)";

export const getTableValues = (plot: PlotName, disaggregateColumn: string, row: PlotData[0]) => {
    if (plot === "table") {
        const r = row as CalibrateDataResponse["data"][0];
        return {
            [`mean_${r[disaggregateColumn]}`]: r.mean,
            [`upper_${r[disaggregateColumn]}`]: r.upper,
            [`lower_${r[disaggregateColumn]}`]: r.lower,
        }
    } else if (plot === "inputComparisonTable") {
        const r = row as InputComparisonData[0];
        return {
            [`spectrum_${r[disaggregateColumn]}`]: r.value_spectrum,
            [`naomi_${r[disaggregateColumn]}`]: r.value_naomi,
            [`difference_${r[disaggregateColumn]}`]: (r.value_naomi != null && r.value_spectrum != null) ? r.value_naomi - r.value_spectrum : null,
        };
    } else {
        throw new Error(`Unreachable, if seeing this you're missing data type '${plot}' in table data prep util.`)
    }
}

export const getColumnDefs = (plot: PlotName, indicatorMetadata: IndicatorMetadata, tableMetadata: TableMetadata,
                              filterSelections: FilterSelection[], headerDefs: TableHeaderDef[],
                              currentLanguage: Language) => {
    const columnId = tableMetadata.column[0];
    const columnSelection = filterSelections.find((f: FilterSelection) => f.filterId == columnId);
    const baseColumns = headerDefs.map((header: TableHeaderDef) => {
        return {
            headerName: header.columnLabel,
            field: header.columnField,
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
    } else if (plot === "inputComparisonTable") {
        const valueKeys = ["naomi", "spectrum", "difference"];
        dataColumns = columnSelection.selection.map((selection: FilterOption) => {
            const childrenColumns = valueKeys.map(key => {
                return {
                    headerName: i18next.t(key, {lng: currentLanguage}),
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
                children: childrenColumns
            }
        });
    }
    return [
        ...baseColumns,
        ...dataColumns
    ];
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
