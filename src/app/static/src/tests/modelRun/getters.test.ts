import {mockModelResultResponse, mockModelRunState} from "../mocks";
import {ModelStatusResponse} from "../../app/generated";
import {modelRunGetters} from "../../app/store/modelRun/modelRun";

describe("model run getters", () => {

    it("is running if the run id exists and the status is not done", () => {

        const state = mockModelRunState({
            status: {id: "1234", done: false} as ModelStatusResponse
        });

        expect(modelRunGetters.running(state)).toBe(true);
    });

    it("is not running if the status is done and not successful", () => {

        const state = mockModelRunState({
            status: {id: "1234", done: true, success: false} as ModelStatusResponse
        });

        expect(modelRunGetters.running(state)).toBe(false);
    });

    it("is running if the status is successful but the result is not fetched", () => {

        const state = mockModelRunState({
            status: {id: "1234", done: true, success: true} as ModelStatusResponse
        });

        expect(modelRunGetters.running(state)).toBe(true);
    });

    it("is not running if the status is successful and the result is not fetched", () => {

        const state = mockModelRunState({
            result: mockModelResultResponse(),
            status: {id: "1234", done: true, success: true} as ModelStatusResponse
        });

        expect(modelRunGetters.running(state)).toBe(false);
    });

});
