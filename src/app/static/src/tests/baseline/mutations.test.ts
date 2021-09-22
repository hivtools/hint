import {BaselineMutation, mutations} from "../../app/store/baseline/mutations";
import {
    mockBaselineState,
    mockDataset,
    mockDatasetResource,
    mockError,
    mockPJNZResponse,
    mockPopulationResponse,
    mockRelease,
    mockRootState,
    mockShapeResponse,
    mockValidateBaselineResponse
} from "../mocks";
import {baselineGetters, BaselineState} from "../../app/store/baseline/baseline";
import {Module} from "vuex";
import {RootState} from "../../app/root";
import {expectAllMutationsDefined} from "../testHelpers";

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
        expect(testState.pjnzErroredFile).toBe(null);
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

    it("sets error on PJNZErroredFile", () => {

        const testState = mockBaselineState();
        mutations[BaselineMutation.PJNZErroredFile](testState, {payload: "error.txt"});
        expect(testState.pjnzErroredFile).toBe("error.txt");
    });

    it("sets country and filename and clears error if present on PJNZUpdated", () => {

        const testState = mockBaselineState({pjnzError: mockError("test"), pjnzErroredFile: "error.txt"});
        mutations[BaselineMutation.PJNZUpdated](testState, {
            payload: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi", iso3: "MWI"}})
        });
        expect(testState.pjnz!!.filename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzError).toBe(null);
        expect(testState.pjnzErroredFile).toBe(null);
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
        const testState = mockBaselineState({shapeError: mockError("test error"), shapeErroredFile: "error.txt"});
        mutations[BaselineMutation.ShapeUpdated](testState, {
            payload: mockShape
        });
        expect(testState.shape).toBe(mockShape);
        expect(testState.shapeError).toBe(null);
        expect(testState.shapeErroredFile).toBe(null);
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

    it("sets error on ShapeErroredFile", () => {

        const testState = mockBaselineState();
        mutations[BaselineMutation.ShapeErroredFile](testState, {payload: "error.txt"});
        expect(testState.shapeErroredFile).toBe("error.txt");
    });

    it("sets response and clears error on PopulationUpdated", () => {

        const mockPop = mockPopulationResponse();
        const testState = mockBaselineState({populationError: mockError("test"), populationErroredFile: "error.txt"});
        mutations[BaselineMutation.PopulationUpdated](testState, {
            payload: mockPop
        });
        expect(testState.population).toBe(mockPop);
        expect(testState.populationError).toBe(null);
        expect(testState.populationErroredFile).toBe(null);
    });

    it("sets error on PopulationUploadError", () => {
        const testState = mockBaselineState();
        mutations[BaselineMutation.PopulationUploadError](testState, {payload: "Some error"});
        expect(testState.populationError).toBe("Some error");
    });

    it("sets error on PopulationErroredFile", () => {

        const testState = mockBaselineState();
        mutations[BaselineMutation.PopulationErroredFile](testState, {payload: "error.txt"});
        expect(testState.populationErroredFile).toBe("error.txt");
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
        const fakeDataset = mockDataset();
        mutations[BaselineMutation.SetDataset](testState, fakeDataset);

        expect(testState.selectedDataset).toEqual(fakeDataset);
    });

    it("SetRelease sets current releease", () => {
        const testState = mockBaselineState();
        const fakeRelease = mockRelease();
        mutations[BaselineMutation.SetRelease](testState, fakeRelease);

        expect(testState.selectedRelease).toEqual(fakeRelease);
    });

    it("UpdateDatasetResources marks resource as out of date and updates metadata if previously null", () => {
        const fakeResource = mockDatasetResource();
        const fakeDataset = mockDataset();
        const testState = mockBaselineState({selectedDataset: fakeDataset});
        mutations[BaselineMutation.UpdateDatasetResources](testState, {pjnz: fakeResource} as any);

        expect(testState.selectedDataset!!.resources.pjnz).toEqual({...fakeResource, outOfDate: true});
    });

    it("UpdateDatasetResources marks resource as out of date and updates metadata if last modified changed", () => {
        const oldResource = mockDatasetResource({lastModified: "2020-11-04T00:00:00", metadataModified: "2020-11-03T00:00:00"});
        const newResouce = mockDatasetResource({lastModified: "2020-11-05T00:00:00", metadataModified: "2020-11-03T00:00:00"});
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = oldResource;
        const testState = mockBaselineState({selectedDataset: fakeDataset});
        mutations[BaselineMutation.UpdateDatasetResources](testState, {pjnz: newResouce} as any);

        expect(testState.selectedDataset!!.resources.pjnz).toEqual({...newResouce, outOfDate: true});
    });

    it("UpdateDatasetResources marks resource as out of date and updates metadata if metadata modified changed", () => {
        const oldResource = mockDatasetResource({lastModified: "2020-11-03T00:00:00", metadataModified: "2020-11-04T00:00:00"});
        const newResouce = mockDatasetResource({lastModified: "2020-11-03T00:00:00", metadataModified: "2020-11-05T00:00:00"});
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = oldResource;
        const testState = mockBaselineState({selectedDataset: fakeDataset});
        mutations[BaselineMutation.UpdateDatasetResources](testState, {pjnz: newResouce} as any);

        expect(testState.selectedDataset!!.resources.pjnz).toEqual({...newResouce, outOfDate: true});
    });

    it("UpdateDatasetResources sets resource to null if new data is null", () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource();
        const testState = mockBaselineState({selectedDataset: fakeDataset});
        mutations[BaselineMutation.UpdateDatasetResources](testState, {pjnz: null} as any);

        expect(testState.selectedDataset!!.resources.pjnz).toEqual(null);
    });

    it("UpdateDatasetResources does nothing if modified values both  match", () => {
        const oldResource = mockDatasetResource({lastModified: "2020-11-03T00:00:00",
                                                        metadataModified: "2020-11-04T00:00:00",outOfDate: false});
        const newResource = mockDatasetResource({lastModified: "2020-11-03T00:00:00",
                                                        metadataModified: "2020-11-04T00:00:00"});
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = oldResource;
        const testState = mockBaselineState({selectedDataset: fakeDataset});
        mutations[BaselineMutation.UpdateDatasetResources](testState, {pjnz: newResource} as any);

        expect(testState.selectedDataset!!.resources.pjnz).toEqual(oldResource);
    });

    it("UpdateDatasetResources does nothing if selectedDataset is null", () => {
        const testState = mockBaselineState();
        mutations[BaselineMutation.UpdateDatasetResources](testState, {pjnz: mockDatasetResource()} as any);

        expect(testState.selectedDataset).toBe(null);
    });

    it("MarkDatasetResourcesUpdated marks all resources as not out of date", () => {
        const fakeDataset = mockDataset();
        fakeDataset.resources.pjnz = mockDatasetResource({outOfDate: true});
        fakeDataset.resources.pop = mockDatasetResource({outOfDate: true});
        fakeDataset.resources.shape = mockDatasetResource({outOfDate: true});
        fakeDataset.resources.survey = mockDatasetResource({outOfDate: true});
        fakeDataset.resources.program = mockDatasetResource({outOfDate: true});
        fakeDataset.resources.anc = mockDatasetResource({outOfDate: true});

        const testState = mockBaselineState({selectedDataset: fakeDataset});
        mutations[BaselineMutation.MarkDatasetResourcesUpdated](testState);

        const resources = testState.selectedDataset!!.resources;
        expect(resources.pjnz!!.outOfDate).toBe(false);
        expect(resources.pop!!.outOfDate).toBe(false);
        expect(resources.shape!!.outOfDate).toBe(false);
        expect(resources.survey!!.outOfDate).toBe(false);
        expect(resources.program!!.outOfDate).toBe(false);
        expect(resources.anc!!.outOfDate).toBe(false);
    });

    it("MarkDatasetResourcesUpdated does nothing if selectedDataset is null", () => {
        const testState = mockBaselineState();
        mutations[BaselineMutation.MarkDatasetResourcesUpdated](testState);
        expect(testState.selectedDataset).toBe(null);
    });

    it("MarkDatasetResourcesUpdated can handle null resources", () => {
        const testState = mockBaselineState({selectedDataset: mockDataset()});
        mutations[BaselineMutation.MarkDatasetResourcesUpdated](testState);
        expect(testState.selectedDataset).toEqual(mockDataset());
    });

});
