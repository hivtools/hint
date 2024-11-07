import {mutations} from "../../app/store/reviewInput/mutations";
import {mockIndicatorMetadata, mockReviewInputState, mockWarning} from "../mocks";

describe("reviewInput mutations", () => {
    it("sets dataset",  () => {
        const state = mockReviewInputState();
        const payload = {datasetId: "dataset1", dataset: ["TEST DATASET"]};
        mutations.SetDataset(state, {payload});
        expect(state.datasets).toStrictEqual({dataset1: ["TEST DATASET"]});
    });

    it("sets loading",  () => {
        const state = mockReviewInputState();
        const payload = true;
        mutations.SetLoading(state, {payload});
        expect(state.loading).toBe(true);
    });

    it("can clear anc datasets", () => {
        const datasets = {
            art: {
                data: [{type: "test", value: "test"}],
                metadata: "TEST"
            },
            anc: {
                data: [{type: "test2", value: "test2"}],
                metadata: "TEST"
            }
        } as any;
        const state = mockReviewInputState({datasets: datasets});
        mutations.ClearDataset(state, {payload: "anc"});
        expect(state.datasets).toEqual({
            art: {
                data: [{type: "test", value: "test"}],
                metadata: "TEST"
            }
        });
    });

    it("can clear art datasets", () => {
        const datasets = {
            art: {
                data: [{type: "test", value: "test"}],
                metadata: "TEST"
            },
            anc: {
                data: [{type: "test2", value: "test2"}],
                metadata: "TEST"
            }
        } as any;
        const state = mockReviewInputState({datasets: datasets});
        mutations.ClearDataset(state, {payload: "art"});
        expect(state.datasets).toEqual({
            anc: {
                data: [{type: "test2", value: "test2"}],
                metadata: "TEST"
            }
        });
    });

    it("sets error", () => {
        const state = mockReviewInputState();
        const error = {"detail": "TEST ERROR", "error": "OTHER_ERROR"};
        mutations.SetError(state, {payload: error});
        expect(state.error).toBe(error);
    });

    it("sets and clears warnings", () => {
        const testState = mockReviewInputState();
        const warnings = [mockWarning()]
        mutations.WarningsFetched(testState, {payload: warnings});
        expect(testState.warnings).toEqual([mockWarning()]);
        mutations.ClearWarnings(testState);
        expect(testState.warnings).toEqual([]);
    });

    it("sets input comparison loading state", () => {
        const testState = mockReviewInputState();
        mutations.SetInputComparisonLoading(testState, {payload: true});
        expect(testState.inputComparison.loading).toBeTruthy();
        mutations.SetInputComparisonLoading(testState, {payload: false});
        expect(testState.inputComparison.loading).toBeFalsy();
    });

    it("sets input comparison error", () => {
        const state = mockReviewInputState();
        const error = {"detail": "TEST ERROR", "error": "OTHER_ERROR"};
        mutations.SetInputComparisonError(state, {payload: error});
        expect(state.inputComparison.error).toBe(error);
    });

    it("sets input comparison data", () => {
        const inputComparisonResponse = {
            data: [
                {x: 1, y: 2},
                {x: 3, y: 4}
            ],
            metadata: mockIndicatorMetadata(),
            warnings: []
        } as any;
        const state = mockReviewInputState();
        mutations.SetInputComparisonData(state, {payload: inputComparisonResponse});
        expect(state.inputComparison.data).toBe(inputComparisonResponse);
    });
});
