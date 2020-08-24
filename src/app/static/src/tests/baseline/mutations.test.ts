import {BaselineMutation, mutations} from "../../app/store/baseline/mutations";
import {
    mockBaselineState, mockError,
    mockPJNZResponse,
    mockPopulationResponse,
    mockRootState,
    mockShapeResponse,
    mockValidateBaselineResponse
} from "../mocks";
import {baselineGetters, BaselineState} from "../../app/store/baseline/baseline";
import {Module} from "vuex";
import {RootState} from "../../app/root";
import {expectAllMutationsDefined} from "../testHelpers";
import {Dataset} from "../../app/types";

describe("Baseline mutations", () => {

    it("all mutation types are defined", () => {
        expectAllMutationsDefined(BaselineMutation, mutations);
    });

    it("sets country, filename and error on PJNZUpdated", () => {

        const testState = mockBaselineState();
        mutations[BaselineMutation.PJNZUpdated](testState, {
            payload: mockPJNZResponse({data: {country: "Malawi", iso3: "MWI"}, filename: "file.pjnz"})
        });
        expect(testState.country).toBe("Malawi");
        expect(testState.iso3).toBe("MWI");
        expect(testState.pjnz!!.filename).toBe("file.pjnz");
        expect(testState.pjnzError).toBe(null);
    });

    it("state becomes complete once all files are Updated and validatedConsistent are true", () => {
        const testStore: Module<BaselineState, RootState> = {
            state: mockBaselineState(),
            getters: baselineGetters
        };
        const testState = testStore.state as BaselineState;
        const testRootState = mockRootState({baseline: testState});
        const complete = testStore.getters!!.complete;

        mutations[BaselineMutation.PJNZUpdated](testState, {
            payload:
                mockPJNZResponse({data: {country: "Malawi", iso3: "MWI"}}), type: "PJNZUpdated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations[BaselineMutation.ShapeUpdated](testState, {
            payload:
                mockShapeResponse(), type: "ShapeUpdated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations[BaselineMutation.PopulationUpdated](testState, {
            payload:
                mockPopulationResponse(), type: "PopulationUpdated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations[BaselineMutation.Validated](testState, {
            payload:
                mockValidateBaselineResponse(), type: "Validated"
        });

        expect(complete(testState, null, testRootState, null)).toBe(true);
    });

    it("sets error on PJNZUploadError", () => {

        const testState = mockBaselineState();
        mutations[BaselineMutation.PJNZUploadError](testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    });

    it("sets country and filename and clears error if present on PJNZUpdated", () => {

        const testState = mockBaselineState({pjnzError: mockError("test")});
        mutations[BaselineMutation.PJNZUpdated](testState, {
            payload: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi", iso3: "MWI"}})
        });
        expect(testState.pjnz!!.filename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzError).toBe(null);
    });

    it("clears country and filename on PJNZUpdated if no data present", () => {

        const testState = mockBaselineState({pjnzError: null, country: "test", pjnz: "TEST" as any});
        mutations[BaselineMutation.PJNZUpdated](testState, {payload: null});

        expect(testState.pjnz).toBe(null);
        expect(testState.country).toBe("");
        expect(testState.iso3).toBe("");
        expect(testState.pjnzError).toBe(null);
    });

    it("sets shape and clears error on ShapeUpdated", () => {

        const mockShape = mockShapeResponse();
        const testState = mockBaselineState({shapeError: null});
        mutations[BaselineMutation.ShapeUpdated](testState, {
            payload: mockShape
        });
        expect(testState.shape).toBe(mockShape);
        expect(testState.shapeError).toBe(null);
    });

    it("sets region filters and flattened region filters on ShapeUpdated", () => {

        const mockShape = mockShapeResponse({
            filters: {
                regions: {
                    id: "MWI", label: "Malawi", children: [
                        {
                            id: "MWI.1", label: "l1"
                        }
                    ]
                }
            }
        });

        const testState = mockBaselineState();
        mutations[BaselineMutation.ShapeUpdated](testState, {
            payload: mockShape
        });
        expect(testState.regionFilters).toStrictEqual([{
            id: "MWI.1", label: "l1"
        }]);
        expect(testState.flattenedRegionFilters).toStrictEqual({
            "MWI.1": {
                id: "MWI.1", label: "l1"
            }
        });
    });

    it("sets error on ShapeUploadError", () => {
        const testState = mockBaselineState();
        mutations[BaselineMutation.ShapeUploadError](testState, {payload: "Some error"});
        expect(testState.shapeError).toBe("Some error");
    });

    it("sets response and clears error on PopulationUpdated", () => {

        const mockPop = mockPopulationResponse();
        const testState = mockBaselineState({populationError: mockError("test")});
        mutations[BaselineMutation.PopulationUpdated](testState, {
            payload: mockPop
        });
        expect(testState.population).toBe(mockPop);
        expect(testState.populationError).toBe(null);
    });

    it("sets error on PopulationUploadError", () => {
        const testState = mockBaselineState();
        mutations[BaselineMutation.PopulationUploadError](testState, {payload: "Some error"});
        expect(testState.populationError).toBe("Some error");
    });

    it("sets ready state", () => {
        const testState = mockBaselineState();
        mutations[BaselineMutation.Ready](testState);
        expect(testState.ready).toBe(true);
    });

    it("Validated sets validation values", () => {
        const testState = mockBaselineState({baselineError: mockError("test error")});
        mutations[BaselineMutation.Validated](testState, {payload: {consistent: true, complete: true}});
        expect(testState.baselineError).toBe(null);
        expect(testState.validatedConsistent).toBe(true);
    });

    it("Validating resets validation values", () => {
        const testState = mockBaselineState({
            validatedConsistent: true,
            baselineError: mockError("test error")
        });

        mutations[BaselineMutation.Validating](testState);

        expect(testState.baselineError).toBe(null);
        expect(testState.validatedConsistent).toBe(false);
    });

    it("BaselineError sets baseline error and validation values", () => {
        const testState = mockBaselineState({
            validatedConsistent: true
        });
        mutations[BaselineMutation.BaselineError](testState, {payload: "test error"});

        expect(testState.baselineError).toBe("test error");
        expect(testState.validatedConsistent).toBe(false);
    });

    it("SetDataset sets current dataset", () => {
        const testState = mockBaselineState();
        const fakeDataset: Dataset = {
            id: "123",
            title: "ADR dataset 1",
            revision_id: "456",
            url: "www.something.com"
        }
        mutations[BaselineMutation.SetDataset](testState, {payload: fakeDataset});

        expect(testState.selectedDataset).toEqual(fakeDataset);
    });

});
