import {actions} from "../../app/store/modelOptions/actions";
import {login} from "./integrationTest";
import {isDynamicFormMeta} from "../../app/components/forms/dynamicFormChecker";

describe("model options actions integration", () => {

    beforeAll(async () => {
        await login();
    });

    it("can get valid model options", async () => {
        const commit = jest.fn();
        await actions.fetchModelRunOptions({commit} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunStarted");
        const payload = commit.mock.calls[0][0]["payload"];
        expect(isDynamicFormMeta(payload)).toBe(true);
    })
});
