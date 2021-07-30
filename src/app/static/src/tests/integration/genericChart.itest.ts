import {actions} from "../../app/store/genericChart/actions";
import {login, rootState} from "./integrationTest";
import {GenericChartMetadataResponse} from "../../app/types";

describe("genericChart actions", () => {
    beforeAll(async () => {
        await login();
    });

    it("can fetch generic chart metadata", async () => {
        const commit = jest.fn();
        await actions.getGenericChartMetadata({commit, rootState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("GenericChartMetadataFetched");
        const response = commit.mock.calls[0][0]["payload"] as GenericChartMetadataResponse;
        expect(response["input-time-series"].datasets.length).toBe(2);
        expect(response["input-time-series"].chartConfig[0].config.startsWith("(")).toBe(true);
    });
});
