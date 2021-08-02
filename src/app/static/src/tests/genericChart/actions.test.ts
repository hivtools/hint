import {mockAxios, mockFailure, mockRootState, mockSuccess} from "../mocks";
import {actions} from "../../app/store/genericChart/actions";

describe("genericChart actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("gets generic chart metadata", async () => {
        mockAxios.onGet("/meta/generic-chart")
            .reply(200, mockSuccess("TEST METADATA"));
        const commit = jest.fn();
        const rootState = mockRootState();
        await actions.getGenericChartMetadata({commit, rootState} as any);
        expect(commit.mock.calls.length).toEqual(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("GenericChartMetadataFetched");
        expect(commit.mock.calls[0][0]["payload"]).toBe("TEST METADATA");
    });

    it("ignores errors",  async () => {
        mockAxios.onGet("/meta/generic-chart")
            .reply(500, mockFailure("TEST ERROR"));
        const commit = jest.fn();
        const rootState = mockRootState();
        await actions.getGenericChartMetadata({commit, rootState} as any);
        expect(commit.mock.calls.length).toEqual(0);
    });
});
