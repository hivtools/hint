import {actions} from "../../app/store/modelRun/actions";

describe("Model run actions", () => {
    it("can trigger model run", async () => {
        const commit = jest.fn();

        await actions.run({commit} as any, {
            max_iterations: 1,
            no_of_simulations: 1,
            options: {
                programme: false,
                anc: false
            }
        });

        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunStarted");
    });

});
