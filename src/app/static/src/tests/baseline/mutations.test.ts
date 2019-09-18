import {mutations} from "../../app/store/baseline/mutations";
import {mockPJNZResponse, mockPopulationResponse, mockShapeResponse} from "../mocks";
import {baselineGetters, BaselineState, initialBaselineState} from "../../app/store/baseline/baseline";
import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {Module} from "vuex";
import {RootState} from "../../app/root";
import {initialFilteredDataState} from "../../app/store/filteredData/filteredData";

describe("Baseline mutations", () => {

    it("sets country, filename and error on PJNZUploaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploaded(testState, {
            payload: mockPJNZResponse({data: {country: "Malawi"}, filename: "file.pjnz"})
        });
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.pjnzError).toBe("");
    });

    it("state becomes complete once all files are uploaded", () => {
        const testStore: Module<BaselineState, RootState> = {
            state: {...initialBaselineState},
            getters: baselineGetters
        };
        const testState = testStore.state as BaselineState;
        const testRootState = {
            version: "",
            filteredData: {...initialFilteredDataState},
            baseline: testState,
            surveyAndProgram: {...initialSurveyAndProgramDataState}
        };
        const complete = testStore.getters!!.complete;

        mutations.PJNZUploaded(testState, {
            payload:
                mockPJNZResponse({data: {country: "Malawi"}}), type: "PJNZLoaded"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.ShapeUploaded(testState, {
            payload:
                mockShapeResponse(), type: "ShapeUploaded"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.PopulationUploaded(testState, {
            payload:
                mockPopulationResponse(), type: "PopulationUploaded"
        });

        expect(complete(testState, null, testRootState, null)).toBe(true);

    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploadError(testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    });

    it("sets country and filename if present on PJNZLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {
            payload: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi"}})
        });
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
    });

    it("does nothing on PJNZLoaded if no data present", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: null});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
    });

    it("sets shape on ShapeLoaded", () => {

        const mockShape = mockShapeResponse();
        const testState = {...initialBaselineState};
        mutations.ShapeUploaded(testState, {
            payload: mockShape
        });
        expect(testState.shape).toBe(mockShape);
    });

    it("sets error on ShapeUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.ShapeUploadError(testState, {payload: "Some error"});
        expect(testState.shapeError).toBe("Some error");
    });

    it("sets response on PopulationLoaded", () => {

        const mockPop = mockPopulationResponse();
        const testState = {...initialBaselineState};
        mutations.PopulationUploaded(testState, {
            payload: mockPop
        });
        expect(testState.population).toBe(mockPop);
    });

    it("sets error on PopulationUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PopulationUploadError(testState, {payload: "Some error"});
        expect(testState.populationError).toBe("Some error");
    });

    it("sets ready state", () => {
        const testState = {...initialBaselineState};
        mutations.Ready(testState);
        expect(testState.ready).toBe(true);
    })

});
