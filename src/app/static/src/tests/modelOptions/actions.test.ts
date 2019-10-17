import {actions} from "../../app/store/modelOptions/actions";

describe("Model run options actions", () => {

    it("commits validation payload", () => {
        const commit = jest.fn();
        actions.validated({commit} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ModelOptionsValidated",
            payload: true
        })
    });

});
