import {
    mockAxios,
    mockFailure,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/metadata/actions";

describe("Metadata actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("commits metadata after successful fetch", async () => {

        mockAxios.onGet(`/meta/plotting/Malawi`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        await actions.getPlottingMetadata({commit} as any, "Malawi");

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PlottingMetadataFetched", payload: "TEST DATA"});
    });

    it("commits error after unsuccessful fetch", async () => {

        mockAxios.onGet(`/meta/plotting/Malawi`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        await actions.getPlottingMetadata({commit} as any, "Malawi");

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "PlottingMetadataError", payload: "Test Error"});
    });
});