import {rootState} from "./integrationTest";
import {actions} from "../../app/store/downloadResults/actions";

describe("download file", () => {
    it(`can download comparison output report`, async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = {
            ...rootState,
            modelCalibrate: {calibrateId: "calibrate123"}
        };

        const state = {comparison: {downloadId: 123, error: null, complete: true}}

        await actions.downloadComparisonReport({commit, dispatch, state, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]["type"]).toBe("ComparisonError");
        expect(commit.mock.calls[0][0]["payload"].detail).toEqual("Missing some results")
        expect(commit.mock.calls[0][0]["payload"].error).toEqual("FAILED_TO_RETRIEVE_RESULT")
    })
})
