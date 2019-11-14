import {actions} from "../../app/store/baseline/actions";
import {login} from "./integrationTest";

const fs = require("fs");
const FormData = require("form-data");

describe("Baseline actions", () => {

    beforeAll(async () => {
        await login();
    });

    it("can upload PJNZ file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {country: "Malawi"} as any;

        const file = fs.createReadStream("../testdata/Botswana2018.PJNZ");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadPJNZ({commit, state, dispatch} as any, formData);

        expect(commit.mock.calls[2][0]["type"]).toBe("PJNZUpdated");
        expect(commit.mock.calls[2][0]["payload"]["filename"])
            .toBe("Botswana2018.PJNZ");

    });

    it("can get baseline data", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        await actions.getBaselineData({commit, dispatch} as any);

        const calls = commit.mock.calls.map((callArgs) => callArgs[0]["type"]);
        expect(calls).toContain("PJNZUpdated");
        expect(calls).toContain("ShapeUpdated");
        expect(calls).toContain("PopulationUpdated");
    });

    it("can upload shape file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const file = fs.createReadStream("../testdata/malawi.geojson");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadShape({commit, dispatch} as any, formData);

        expect(commit.mock.calls[2][0]["type"]).toBe("ShapeUpdated");
        expect(commit.mock.calls[2][0]["payload"]["filename"])
            .toBe("malawi.geojson");

    }, 10000);

    it("can upload population file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const file = fs.createReadStream("../testdata/population.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadPopulation({commit, dispatch} as any, formData);

        expect(commit.mock.calls[2][0]["type"]).toBe("PopulationUpdated");
        expect(commit.mock.calls[2][0]["payload"]["filename"])
            .toBe("population.csv");
    });

    it ("can validate baseline data", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();

        await actions.validate({commit, dispatch} as any);
        expect(commit.mock.calls[1][0]["type"]).toBe("BaselineError");
        expect(commit.mock.calls[1][0]["payload"]).toContain("Countries aren't consistent");
    });

});