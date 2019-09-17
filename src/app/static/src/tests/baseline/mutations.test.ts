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

    it("sets country and filename and clears error if present on PJNZLoaded", () => {

        const testState = {...initialBaselineState, pjnzError : "test"};
        mutations.PJNZLoaded(testState, {
            payload: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi"}})
        });
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzError).toBe("");
    });

    it("does nothing on PJNZLoaded if no data present", () => {

        const testState = {...initialBaselineState, pjnzError: ""};
        mutations.PJNZLoaded(testState, {payload: null});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
        expect(testState.pjnzError).toBe("");
    });

    it("sets shape and clears error on ShapeLoaded", () => {

        const mockShape = mockShapeResponse();
        const testState = {...initialBaselineState, shapeError: ""};
        mutations.ShapeUploaded(testState, {
            payload: mockShape
        });
        expect(testState.shape).toBe(mockShape);
        expect(testState.shapeError).toBe("");
    });

    it("sets error on ShapeUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.ShapeUploadError(testState, {payload: "Some error"});
        expect(testState.shapeError).toBe("Some error");
    });

    it("sets response and clears error on PopulationLoaded", () => {

        const mockPop = mockPopulationResponse();
        const testState = {...initialBaselineState, populationError: "test"};
        mutations.PopulationUploaded(testState, {
            payload: mockPop
        });
        expect(testState.population).toBe(mockPop);
        expect(testState.populationError).toBe("");
    });

    it("sets error on PopulationUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PopulationUploadError(testState, {payload: "Some error"});
        expect(testState.populationError).toBe("Some error");
    });

});
