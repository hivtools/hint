import {mockAxios, mockSuccess} from "../mocks";
import {actions} from "../../app/store/modelRun/actions";

describe("Model run actions", () => {

    it("commits run id after triggering a model run ", async () => {

        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const commit = jest.fn();
        await actions.run({commit} as any, {
            max_iterations: 1,
            no_of_simulations: 1,
            options: {
                programme: false,
                anc: false
            }
        });

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ModelRunStarted",
            payload: {id: "12345"}
        });

    });

});
