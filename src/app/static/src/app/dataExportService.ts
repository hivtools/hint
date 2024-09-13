import * as XLSX from "xlsx";
import {DownloadIndicatorPayload, DownloadIndicatorDataset} from "./types";

export interface ExportService {
    download: () => void
    addFilteredData: () => ExportService
    addUnfilteredData: () => ExportService
}

export class DataExportService implements ExportService {
    private readonly _data: DownloadIndicatorDataset
    private readonly _filename: string
    private readonly _options: any

    private readonly _workbook: XLSX.WorkBook;

    constructor(payload: DownloadIndicatorPayload) {
        this._filename = payload.filename
        this._data = payload.data
        this._workbook = XLSX.utils.book_new();
        this._options = payload.options;
    }

    addFilteredData = (): ExportService => {
        let worksheet;
        if (this._options) {
            worksheet = XLSX.utils.json_to_sheet(this._data.filteredData, this._options);
        } else {
            worksheet = XLSX.utils.json_to_sheet(this._data.filteredData);
        }
        XLSX.utils.book_append_sheet(this._workbook, worksheet, "filtered data");
        return this;
    }

    addUnfilteredData = (): ExportService => {
        const worksheet = XLSX.utils.json_to_sheet(this._data.unfilteredData);
        XLSX.utils.book_append_sheet(this._workbook, worksheet, "all data");
        return this;
    }

    download = (): void => {
        XLSX.writeFile(this._workbook, this._filename);
    }
}

export const exportService = (payload: DownloadIndicatorPayload) => new DataExportService(payload);
