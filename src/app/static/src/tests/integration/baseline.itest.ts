import {actions} from "../../app/store/baseline/actions";

const fs = require("fs");
const FormData = require("form-data");

describe("Baseline actions", () => {

    it("can upload PJNZ file", async () => {
        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/Botswana2018.PJNZ");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadPJNZ({commit} as any, formData);
        expect(commit.mock.calls[0][0]["type"]).toBe("PJNZUploaded");
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
    });

    it("can upload shape file", async () => {
        const commit = jest.fn();

        const file = fs.createReadStream("Malawi_1.pjnz");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadShape({commit} as any, formData);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ShapeUploadError",
            payload: "File does not exist. Create it, or fix the path."
        });
    });

});
