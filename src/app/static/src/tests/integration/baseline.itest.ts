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

    it("can get baseline data", async (done) => {
        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        setTimeout(() => {
            const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
            expect(calls).toContain("PJNZLoaded");
            expect(calls).toContain("ShapeUploaded");
            done();
        });

    });

    it("can upload shape file", async () => {
        const commit = jest.fn();

        const file = fs.createReadStream("../testdata/malawi.geojson");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadShape({commit} as any, formData);
        expect(commit.mock.calls[0][0]["type"]).toBe("ShapeUploaded");
    }, 10000);

});
