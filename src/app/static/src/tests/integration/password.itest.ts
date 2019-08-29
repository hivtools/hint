import {actions} from "../../app/store/password/actions";

describe("Password actions", () => {

    it("can request password reset link", async () => {

        const commit = jest.fn();
        await actions.requestResetLink({commit} as any, "test.user@example.com");

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ResetLinkRequested",
            payload: null
        });
    });

});