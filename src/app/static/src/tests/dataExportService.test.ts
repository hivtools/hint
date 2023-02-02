import {mockDownloadIndicatorData} from "./mocks";
import {exportService} from "../app/dataExportService";

const mockJsonToSheet = jest.fn().mockImplementation((data) => ({ data, type: "json" }));
const mockBookNew = jest.fn().mockImplementation(() => ({ sheets: [] } as any));
const mockBookAppendSheet = jest.fn().mockImplementation((workbook: any, worksheet: any, name: string) => {
    (workbook as any).sheets.push({ ...worksheet, name });
});
const mockWriteFile = jest.fn();

jest.mock("xlsx", () => ({
    writeFile: (data: any, fileName: string) => mockWriteFile(data, fileName),
    utils: {
        json_to_sheet: (data: any) => mockJsonToSheet(data),
        book_new: () => mockBookNew(),
        book_append_sheet: (wb: any, ws: any, name: string) => mockBookAppendSheet(wb, ws, name)
    }
}));

describe("data export service", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const expectedFilteredData = {
        data: [
            {
                "area_id": "MWI",
                "area_name": "Malawi",
                "value": 20
            }
        ],
        name: "filtered data",
        type: "json"
    }

    const expectedUnfilteredData = {
        data: [
            {
                "area_id": "MWI",
                "area_name": "Malawi",
                "value": 30
            },
            {
                "area_id": "MWI",
                "area_name": "Malawi",
                "value": 20
            }
        ],
        name: "all data",
        type: "json"
    }


    it('can download filtered and unfiltered data', () => {
        const data = mockDownloadIndicatorData()

        exportService({data, filename: "MWI_naomi_data.xlsx"})
            .addUnfilteredData()
            .addFilteredData()
            .download()

        expect(mockBookNew).toHaveBeenCalledTimes(1);
        expect(mockJsonToSheet).toHaveBeenCalledTimes(2);
        expect(mockBookAppendSheet).toHaveBeenCalledTimes(2);
        expect(mockWriteFile).toHaveBeenCalledTimes(1);
        expect(mockWriteFile.mock.calls[0][0]).toStrictEqual({
            sheets: [
                expectedUnfilteredData,
                expectedFilteredData
            ]
        });
        const filename = mockWriteFile.mock.calls[0][1]
        console.log(mockWriteFile.mock.calls[0][1])
        expect(filename.split(".")[0]).toContain("MWI_naomi_data");
        expect(filename.split(".")[1]).toBe("xlsx");

    });

    it('can download only filtered data', () => {
        const data = mockDownloadIndicatorData()

        exportService({data, filename: "MWI_naomi_data.xlsx"})
            .addFilteredData()
            .download()

        assertExpectedSingleSheet()
    });

    it('can download only unfiltered data', () => {
        const data = mockDownloadIndicatorData()

        exportService({data, filename: "MWI_naomi_data.xlsx"})
            .addUnfilteredData()
            .download()

        assertExpectedSingleSheet()
    });

})

const assertExpectedSingleSheet = () => {
    expect(mockBookNew).toHaveBeenCalledTimes(1);
    expect(mockJsonToSheet).toHaveBeenCalledTimes(1);
    expect(mockBookAppendSheet).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
}