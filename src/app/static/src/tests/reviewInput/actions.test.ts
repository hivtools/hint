import {mockAxios, mockFailure, mockRootState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/reviewInput/actions";
import {ReviewInputMutation} from "../../app/store/reviewInput/mutations";
import {freezer} from "../../app/utils";
import {Mock} from "vitest";

describe("reviewInput actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = vi.fn();
        mockAxios.reset();
        vi.clearAllMocks();
    });

    afterEach(() => {
        (console.log as Mock).mockClear();
    });

    const rootState = mockRootState();

    it("gets dataset and warnings", async () => {
        const response = {data: "TEST DATASET", metadata: "TEST META", warnings: "TEST WARNINGS"}
        const mockResponse = mockSuccess(response);
        mockAxios.onGet("/dataset1")
            .reply(200, mockResponse);
        const commit = vi.fn();
        const payload = {datasetId: "dataset1", url: "/dataset1"};
        const deepFreeze = vi.spyOn(freezer, "deepFreeze");
        await actions.getDataset({commit, rootState} as any, payload);
        expect(commit.mock.calls.length).toEqual(3);
        expect(commit.mock.calls[0][0]["type"]).toBe(ReviewInputMutation.SetError);
        expect(commit.mock.calls[0][0]["payload"]).toBeNull();
        expect(commit.mock.calls[1][0]["type"]).toBe(ReviewInputMutation.SetDataset);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({dataset: response, datasetId: "dataset1"});
        expect(commit.mock.calls[2][0]["type"]).toBe(ReviewInputMutation.WarningsFetched);
        expect(commit.mock.calls[2][0]["payload"]).toStrictEqual("TEST WARNINGS");
        expect(deepFreeze).toHaveBeenCalledWith(mockResponse);
    });

    it("sets error on get dataset", async () => {
        mockAxios.onGet("/dataset1")
            .reply(500, mockFailure("TEST ERROR"));
        const commit = vi.fn();
        const payload = {datasetId: "dataset1", url: "/dataset1"};
        await actions.getDataset({commit, rootState} as any, payload);
        expect(commit.mock.calls.length).toEqual(2);
        expect(commit.mock.calls[0][0]["type"]).toBe(ReviewInputMutation.SetError);
        expect(commit.mock.calls[0][0]["payload"]).toBeNull();
        expect(commit.mock.calls[1][0]["type"]).toBe(ReviewInputMutation.SetError);
        expect(commit.mock.calls[1][0]["payload"]).toStrictEqual({"detail": "TEST ERROR", "error": "OTHER_ERROR"})
    });

    it("refreshes datasets", async () => {
        const dispatch = vi.fn();
        await actions.refreshDatasets({dispatch} as any);

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("getDataset");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({datasetId: "programme", url: "/chart-data/input-time-series/programme"});
        expect(dispatch.mock.calls[1][0]).toBe("getDataset");
        expect(dispatch.mock.calls[1][1]).toStrictEqual({datasetId: "anc", url: "/chart-data/input-time-series/anc"});
    });
});
