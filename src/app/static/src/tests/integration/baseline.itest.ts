import {actions} from "../../app/store/baseline/actions";
import {login} from "./integrationTest";
import {mockBaselineState} from "../mocks";

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

        expect(commit.mock.calls[1][0]["type"]).toBe("PJNZUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("E66ECF0E9BE8BE814547EA7574700DD3.PJNZ");

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
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("A59C122F27303D93467C0F2D09489878.geojson");

    }, 10000);

    it("can upload population file", async () => {
        const commit = jest.fn();
        const file = fs.createReadStream("../testdata/population.csv");
        const formData = new FormData();
        formData.append('file', file);

        await actions.uploadPopulation({commit} as any, formData);

        expect(commit.mock.calls[1][0]["type"]).toBe("PopulationUpdated");
        expect(commit.mock.calls[1][0]["payload"]["filename"])
            .toBe("365A2F42B939E5390AA4DE2720708F77.csv");
    });

});