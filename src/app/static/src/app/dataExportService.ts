import type {JSON2SheetOpts} from "xlsx";
import type {DownloadIndicatorPayload, DownloadIndicatorDataset} from "./types";

export interface ExportService {
    download: () => Promise<void>
    addFilteredData: () => ExportService
    addUnfilteredData: () => ExportService
}

type Sheet = {
    name: string
    rows: unknown[]
    options?: JSON2SheetOpts
}

export class DataExportService implements ExportService {
    private readonly _data: DownloadIndicatorDataset
    private readonly _filename: string
    private readonly _options: any
    private readonly _sheets: Sheet[] = [];

    constructor(payload: DownloadIndicatorPayload) {
        this._filename = payload.filename
        this._data = payload.data
        this._options = payload.options;
    }

    addFilteredData = (): ExportService => {
        this._sheets.push({name: "filtered data", rows: this._data.filteredData, options: this._options});
        return this;
    }

    addUnfilteredData = (): ExportService => {
        this._sheets.push({name: "all data", rows: this._data.unfilteredData});
        return this;
    }

    // xlsx is large, so the browser gets it only when the user downloads a file.
    download = async (): Promise<void> => {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();
        this._sheets.forEach(sheet => {
            const worksheet = sheet.options
                ? XLSX.utils.json_to_sheet(sheet.rows, sheet.options)
                : XLSX.utils.json_to_sheet(sheet.rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });
        XLSX.writeFile(workbook, this._filename);
    }
}

export const exportService = (payload: DownloadIndicatorPayload) => new DataExportService(payload);
