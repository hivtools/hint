import {actions} from "../../app/store/modelOptions/actions";
import { ModelOptionsMutation } from "../../app/store/modelOptions/mutations";
import {mockAxios, mockModelOptionsState, mockRootState, mockSuccess} from "../mocks";

const rootState = mockRootState();
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
        await actions.fetchModelRunOptions({commit, rootState} as any);

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


    it("fetches validation options", async () => {
        mockAxios.onPost("/model/validate/options/").reply(200, mockSuccess("TEST", "v1"));
        const commit = jest.fn();
        const payload = jest.fn();
        await actions.validateModelOptions({commit, rootState} as any, payload as any);

        expect(commit.mock.calls[0][0]).toStrictEqual(ModelOptionsMutation.Validating);
        expect(commit.mock.calls[1][0]).toStrictEqual(ModelOptionsMutation.LoadUpdatedOptions);

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: ModelOptionsMutation.Validate,
            payload: "TEST"
        });
        expect(commit.mock.calls[3][0]).toStrictEqual(ModelOptionsMutation.Validated);
    });
});
