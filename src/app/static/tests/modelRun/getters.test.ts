import {mockModelResultResponse, mockModelRunState} from "../mocks";
import {ModelStatusResponse} from "../../src/generated";
import {modelRunGetters} from "../../src/store/modelRun/modelRun";

describe("model run getters", () => {

    it("is running if the startedRunning is true and the status is not done", () => {

        const state = mockModelRunState({
            status: {done: false} as ModelStatusResponse,
            startedRunning: true
        });

        expect(modelRunGetters.running(state)).toBe(true);
    });

    it("is not running if the status is done and not successful", () => {

        const state = mockModelRunState({
            status: {done: true, success: false} as ModelStatusResponse,
            startedRunning: false
        });

        expect(modelRunGetters.running(state)).toBe(false);
    });

    it("is running if the status is successful but the result is not fetched", () => {

        const state = mockModelRunState({
            status: {done: true, success: true} as ModelStatusResponse,
            startedRunning: true
        });

        expect(modelRunGetters.running(state)).toBe(true);
    });

    it("is not running if the status is successful and the result is not fetched", () => {

        const state = mockModelRunState({
            result: mockModelResultResponse(),
            status: {done: true, success: true} as ModelStatusResponse,
            startedRunning: true
        });

        expect(modelRunGetters.running(state)).toBe(false);
    });

});
