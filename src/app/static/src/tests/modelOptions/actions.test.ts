import {actions} from "../../app/store/modelOptions/actions";
import {mockAxios, mockSuccess} from "../mocks";

describe("model run options actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("fetches and commits model run options and version", async () => {
        mockAxios.onGet("/model/options/").reply(200, mockSuccess("TEST", "v1"));
        const commit = jest.fn();
        await actions.fetchModelRunOptions({commit} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual("FetchingModelOptions");
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ModelOptionsFetched",
            payload: "TEST"
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: "SetModelOptionsVersion",
            payload: "v1"
        });
    });

});
