import {mockAxios, mockFailure, mockSuccess} from "../mocks";
import {actions} from "../../app/store/password/actions";

describe("Password actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });


    it("requests reset link and commits success", async () => {

        mockAxios.onPost(`/password/request-reset-link/`)
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        await actions.requestResetLink({commit} as any, "test@email.com");

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ResetLinkRequested",
            payload: true
        });
    });

    it("requests reset link and commits error", async () => {

        mockAxios.onPost(`/password/request-reset-link/`)
            .reply(500, mockFailure("test error"));

        const commit = jest.fn();
        await actions.requestResetLink({commit} as any, "test@email.com");

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RequestResetLinkError",
            payload: "test error"
        });
    });

});