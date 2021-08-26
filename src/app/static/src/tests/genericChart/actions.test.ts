import {mockAxios, mockFailure, mockRootState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/genericChart/actions";
import {GenericChartMutation} from "../../app/store/genericChart/mutations";

describe("genericChart actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    const rootState = mockRootState();

    it("gets generic chart metadata", async () => {
        mockAxios.onGet("/meta/generic-chart")
            .reply(200, mockSuccess("TEST METADATA"));
        const commit = jest.fn();
        await actions.getGenericChartMetadata({commit, rootState} as any);
        expect(commit.mock.calls.length).toEqual(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("GenericChartMetadataFetched");
        expect(commit.mock.calls[0][0]["payload"]).toBe("TEST METADATA");
    });

    it("generic chart metadata action ignores errors",  async () => {
        mockAxios.onGet("/meta/generic-chart")
            .reply(500, mockFailure("TEST ERROR"));
        const commit = jest.fn();
        await actions.getGenericChartMetadata({commit, rootState} as any);
        expect(commit.mock.calls.length).toEqual(0);
    });

    it("gets dataset", async () => {
        mockAxios.onGet("/dataset1")
            .reply(200, mockSuccess("TEST DATASET"));
        const commit = jest.fn();
        const payload = {datasetId: "dataset1", url: "/dataset1"};
        await actions.getDataset({commit, rootState} as any, payload);
        expect(commit.mock.calls.length).toEqual(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(GenericChartMutation.SetError);
        expect(commit.mock.calls[0][0]["payload"]).toBeNull();
        expect(commit.mock.calls[1][0]["type"]).toBe(GenericChartMutation.SetDataset);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({dataset: "TEST DATASET", datasetId: "dataset1"});
    });

    it("sets error on get dataset", async () => {
        mockAxios.onGet("/dataset1")
            .reply(500, mockFailure("TEST ERROR"));
        const commit = jest.fn();
        const payload = {datasetId: "dataset1", url: "/dataset1"};
        await actions.getDataset({commit, rootState} as any, payload);
        expect(commit.mock.calls.length).toEqual(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(GenericChartMutation.SetError);
        expect(commit.mock.calls[0][0]["payload"]).toBeNull();
        expect(commit.mock.calls[1][0]["type"]).toBe(GenericChartMutation.SetError);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({"detail": "TEST ERROR", "error": "OTHER_ERROR"})
    });
});
