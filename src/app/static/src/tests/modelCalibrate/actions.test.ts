import {mockAxios, mockModelCalibrateState} from "../mocks";
import {actions} from "../../app/store/modelCalibrate/actions";
import {ModelCalibrateMutation} from "../../app/store/modelCalibrate/mutations";

describe("ModelCalibrate actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("fetchModelCalibrateOptions commits Fetching and Fetched mutations", async () => {
        const commit = jest.fn();
        const state = mockModelCalibrateState();
        await actions.fetchModelCalibrateOptions({commit, state} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        expect(commit.mock.calls[1][0]).toBe(ModelCalibrateMutation.ModelCalibrateOptionsFetched);
    });

    it("calibrate action commits calibrate mutation", async () => {
        const commit = jest.fn();
        const state = mockModelCalibrateState();
        await actions.calibrate({commit, state} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.Calibrated);
    });
});
