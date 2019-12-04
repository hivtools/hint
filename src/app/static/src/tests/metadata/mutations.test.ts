import {mutations} from "../../app/store/metadata/mutations";
import {
    mockError,
    mockMetadataState,
    mockPlottingMetadataResponse,
} from "../mocks";

describe("Metadata mutations", () => {

    it("sets metadata on PlottingMetadataFetched", () => {

        const testResponse = mockPlottingMetadataResponse();
        const testState = mockMetadataState({plottingMetadataError: mockError("previous error")});
        mutations.PlottingMetadataFetched(testState, {
            payload:testResponse
        });
        expect(testState.plottingMetadata).toStrictEqual(testResponse);
        expect(testState.plottingMetadataError).toBe(null);
    });

    it("sets error on PlottingMetadataError", () => {
        const testState = mockMetadataState();
        const error = mockError("Test Error");
        mutations.PlottingMetadataError(testState, {
            payload: error
        });
        expect(testState.plottingMetadataError).toBe(error);
    });
});