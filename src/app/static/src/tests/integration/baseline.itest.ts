import {actions} from "../../app/store/baseline/actions";

const fs = require("fs");
const FormData = require("form-data");

describe("Baseline actions", () => {

    beforeEach(() => {
        fs.writeFileSync("Malawi_1.pjnz");
    });

    afterEach(() => {
        fs.unlinkSync("Malawi_1.pjnz")
    });

    it("can upload PJNZ file", async () => {
        const commit = jest.fn();

        const file = fs.createReadStream("Malawi_1.pjnz");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadPJNZ({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PJNZUploaded",
            payload: {data: {country: "Malawi"}, filename: "Malawi_1.pjnz", type: "pjnz"}
        });
    });

    it("can get baseline data", async () => {

        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "PJNZLoaded",
            payload: null
        });

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ShapeUploaded",
            payload: null
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "PopulationUploaded",
            payload: null
        });
    });

    it("can upload shape file", async () => {
        await expectUpload(actions.uploadShape, "ShapeUploadError", "File does not exist. Create it, or fix the path.");
    });

    it("can upload population file", async () => {
        await expectUpload(actions.uploadPopulation, "PopulationUploadError", "cannot open the connection");
    });

    const expectUpload = async (action: (commit: any, formData: any) => void,
                                expectedErrorType: string,
                                expectedErrorMessage: string) => {
        const commit = jest.fn();

        const file = fs.createReadStream("Malawi_1.pjnz");
        const formData = new FormData();
        formData.append('file', file);

        await action({commit}, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: expectedErrorType,
            payload: expectedErrorMessage
        });
    }

});
