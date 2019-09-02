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

    it("calls reset password endpoint and commits success", async () => {

        mockAxios.onPost(`/password/reset-password/`)
            .reply(200, mockSuccess(true));

        const commit = jest.fn();
        await actions.resetPassword({commit} as any, {"token": "testToken", "password": "new_password"});

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ResetPassword",
            payload: true
        });
    });

    it("calls reset password endpoint and commits error", async () => {

        mockAxios.onPost(`/password/reset-password/`)
            .reply(500, mockFailure("test error"));

        const commit = jest.fn();
        await actions.resetPassword({commit} as any, {"token": "testToken", "password": "new_password"});

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ResetPasswordError",
            payload: "test error"
        });
    });

});
