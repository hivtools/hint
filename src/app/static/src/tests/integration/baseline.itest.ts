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
        expect(commit.mock.calls[1][0]["type"]).toBe("PJNZUpdated");
    });

    it("can get baseline data", async () => {
        const commit = jest.fn();
        await actions.getBaselineData({commit} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain("PJNZUpdated");
        expect(calls).toContain("ShapeUpdated");
        expect(calls).toContain("PopulationUpdated");
    });

    it("can upload shape file", async () => {
        const commit = jest.fn();
        const file = fs.createReadStream("../testdata/malawi.geojson");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadShape({commit} as any, formData);
        expect(commit.mock.calls[1][0]["type"]).toBe("ShapeUpdated");

    }, 10000);

    it("can upload population file", async () => {
        const commit = jest.fn();
        const file = fs.createReadStream("../testdata/population.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadPopulation({commit} as any, formData);
        expect(commit.mock.calls[1][0]["type"]).toBe("PopulationUpdated");
    });

});
