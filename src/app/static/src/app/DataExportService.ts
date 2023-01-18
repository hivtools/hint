import * as XLSX from "xlsx";
import {DownloadPlotData} from "./types";

interface ExportService {
    download: () => void
    addFilteredData: () => ExportService
    addUnfilteredData: () => ExportService
}

export class DataExportService implements ExportService {
    private readonly _data: DownloadPlotData

    private readonly _workbook: XLSX.WorkBook;

    constructor(data: DownloadPlotData) {
        this._data = data
        this._workbook = XLSX.utils.book_new();
    }

    addFilteredData = (): ExportService => {
        const worksheet = XLSX.utils.json_to_sheet(this._data.filteredData);
        XLSX.utils.book_append_sheet(this._workbook, worksheet, "filtered data");
        return this;
    }

    addUnfilteredData = (): ExportService => {
        const worksheet = XLSX.utils.json_to_sheet(this._data.unfilteredData);
        XLSX.utils.book_append_sheet(this._workbook, worksheet, "aggregate data");
        return this;
    }

    download = (): void => {
        XLSX.writeFile(this._workbook, `chart-data-${new Date().toISOString()}.xlsx`);
    }
}

export const exportService = (data: DownloadPlotData) => new DataExportService(data);