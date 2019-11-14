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

    it("fetches and commits model run options", async () => {
        mockAxios.onGet("/model/options/").reply(200, mockSuccess("TEST"));
        const commit = jest.fn();
        await actions.fetchModelRunOptions({commit} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual("FetchingModelOptions");
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "ModelOptionsFetched",
            payload: "TEST"
        });
    });

});
