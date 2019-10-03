import {mutations} from "../../app/store/metadata/mutations";
import {
    mockMetadataState,
    mockPlottingMetadataResponse,
} from "../mocks";

describe("Metadata mutations", () => {

    it("sets metadata on PlottingMetadataFetched", () => {

        const testResponse = mockPlottingMetadataResponse();
        const testState = mockMetadataState({plottingMetadataError: "previous error"});
        mutations.PlottingMetadataFetched(testState, {
            payload:testResponse
        });
        expect(testState.plottingMetadata).toStrictEqual(testResponse);
        expect(testState.plottingMetadataError).toBe("");
    });

    it("sets error on PlottingMetadataError", () => {

        const testResponse = mockPlottingMetadataResponse();
        const testState = mockMetadataState();
        mutations.PlottingMetadataError(testState, {
            payload: "Test Error"
        });
        expect(testState.plottingMetadataError).toBe("Test Error");
    });
});