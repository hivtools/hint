import {mutations} from "../../app/store/metadata/mutations";
import {
    mockMetadataState,
    mockModelRunState,
    mockPJNZResponse, mockPlottingMetadataResponse,
    mockPopulationResponse,
    mockRootState,
    mockShapeResponse
} from "../mocks";
import {baselineGetters, BaselineState, initialBaselineState} from "../../app/store/baseline/baseline";
import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {Module} from "vuex";
import {RootState} from "../../app/root";
import {initialFilteredDataState} from "../../app/store/filteredData/filteredData";

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