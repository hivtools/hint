import {actions} from "../../app/store/baseline/actions";
import {login} from "./integrationTest";
import {PjnzResponse, PopulationResponse, ShapeResponse} from "../../app/generated";
import {getFormData} from "./helpers";

describe("Baseline actions", () => {

    beforeAll(async () => {
        await login();
    });

    it("can upload PJNZ file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = {country: "Malawi"} as any;
        const formData = getFormData("Botswana2018.PJNZ");

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
        const formData = getFormData("malawi.geojson");
        await actions.uploadShape({commit, dispatch} as any, formData);

        expect(commit.mock.calls[2][0]["type"]).toBe("ShapeUpdated");
        expect(commit.mock.calls[2][0]["payload"]["filename"])
            .toBe("malawi.geojson");

    }, 10000);

    it("can upload population file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("population.csv");
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

    it("can delete PJNZ", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("Botswana2018.PJNZ");

        // upload
        await actions.uploadPJNZ({commit, dispatch} as any, formData);
        const hash = (commit.mock.calls[2][0]["payload"] as PjnzResponse).hash;

        commit.mockReset();

        // delete
        await actions.deletePJNZ({commit, dispatch} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("PJNZUpdated");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getBaselineData({commit, dispatch} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == "PJNZUpdated")[0]["payload"]).toBe(null);
    });

    it("can delete shape", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("malawi.geojson");

        // upload
        await actions.uploadShape({commit, dispatch} as any, formData);
        const hash = (commit.mock.calls[2][0]["payload"] as ShapeResponse).hash;

        commit.mockReset();

        // delete
        await actions.deleteShape({commit, dispatch} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ShapeUpdated");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getBaselineData({commit, dispatch} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == "ShapeUpdated")[0]["payload"]).toBe(null);
    });

    it("can delete population", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const formData = getFormData("population.csv");

        // upload
        await actions.uploadPopulation({commit, dispatch} as any, formData);
        const hash = (commit.mock.calls[2][0]["payload"] as PopulationResponse).hash;

        commit.mockReset();

        // delete
        const state = {population: {hash: hash}};
        await actions.deletePopulation({commit, dispatch, state} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("PopulationUpdated");

        commit.mockReset();

        // if the file has been deleted, data should come back null
        await actions.getBaselineData({commit, dispatch} as any);
        expect(commit.mock.calls.find(c => c[0]["type"] == "PopulationUpdated")[0]["payload"]).toBe(null);
    });

});