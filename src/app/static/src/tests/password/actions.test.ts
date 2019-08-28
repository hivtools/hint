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


    it("requests reset link and commits success", (done) => {

        mockAxios.onPost(`/password/request-reset-link/`)
            .reply(200, mockSuccess(null));

        const commit = jest.fn();
        actions.requestResetLink({commit} as any, "test@email.com");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "ResetLinkRequested",
                payload: null
            });
            done();
        })
    });

    it("requests reset link and commits error", (done) => {

        mockAxios.onPost(`/password/request-reset-link/`)
            .reply(500, mockFailure("test error"));

        const commit = jest.fn();
        actions.requestResetLink({commit} as any, "test@email.com");

        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({
                type: "RequestResetLinkError",
                payload: "test error"
            });
            done();
        })
    });

});