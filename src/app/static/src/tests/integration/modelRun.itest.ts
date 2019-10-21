import {actions} from "../../app/store/modelRun/actions";
import {login} from "./integrationTest";

describe("Model run actions", () => {

    beforeAll(async () => {
        await login();
    });

    it("can trigger model run", async () => {
        const commit = jest.fn();

        await actions.run({commit} as any, {
            max_iterations: "1",
            no_of_simulations: "1",
            quarters: ["q1", "q2"]
        });

        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunStarted");
    });

});
