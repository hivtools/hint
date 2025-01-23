import {AreaProperties, baselineGetters} from "../../src/store/baseline/baseline";
import {
    mockADRDatasetState,
    mockADRDataState,
    mockADRState,
    mockBaselineState,
    mockDatasetResource,
    mockPopulationResponse,
    mockRootState,
    mockShapeResponse
} from "../mocks";
import {ShapeResponse} from "../../src/generated";
import {Dict} from "../../src/types";
import {AdrDatasetType} from "../../src/store/adr/adr";

it("is complete iff all files are present", () => {
    let state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        iso3: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(true);

    state = mockBaselineState({
        country: "AFG",
        iso3: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        iso3: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        shape: mockShapeResponse(),
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        iso3: "AFG",
        population: mockPopulationResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);

    state = mockBaselineState({
        validatedConsistent: true,
        country: "AFG",
        iso3: "AFG",
        shape: mockShapeResponse()
    });
    expect(baselineGetters.complete(state)).toBe(false);
});

it("selectedDatasetAvailableResources only returns resources that the user has permissions for (ie, exists in relevant dataset)", () => {
    const resources = [
        {resource_type: "inputs-unaids-spectrum-file"},
        {resource_type: "inputs-unaids-population"},
        {resource_type: "inputs-unaids-geographic"},
        {resource_type: "inputs-unaids-survey"},
        {resource_type: "inputs-unaids-art"},
        {resource_type: "inputs-unaids-anc"}
    ]

    const selectedDataset = {
        id: "id1",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {id: "org-id"},
        resources: {
            pjnz: mockDatasetResource(),
            program: mockDatasetResource(),
            pop: null,
            survey: null,
            shape: null,
            anc: null,
            vmmc: null
        }
    }

    const datasets = [
        {
            id: "id1",
            title: "Some data",
            organization: {title: "org", id: "org-id"},
            name: "some-data",
            type: "naomi-data",
            resources
        }
    ]

    let state = mockBaselineState({
        selectedDataset
    });
    let rootState = mockRootState({
        adr: mockADRState({
            adrData: mockADRDataState({
                [AdrDatasetType.Input]: mockADRDatasetState({
                    datasets
                })
            })
        })
    })

    const getters = vi.fn()
    expect(baselineGetters.selectedDatasetAvailableResources(state, getters, rootState)).toStrictEqual(selectedDataset.resources);

    state = mockBaselineState({
        selectedDataset
    });
    rootState = mockRootState({
        adr: mockADRState({
            adrData: mockADRDataState({
                [AdrDatasetType.Input]: mockADRDatasetState({
                    datasets: [
                        {
                            id: "id1",
                            title: "Some data",
                            organization: {title: "org", id: "org-id"},
                            name: "some-data",
                            type: "naomi-data",
                            resources: [
                                {resource_type: "inputs-unaids-spectrum-file"}
                            ]
                        }
                    ]
                })
            })
        })
    })
    expect(baselineGetters.selectedDatasetAvailableResources(state, getters, rootState)).toStrictEqual({
        ...selectedDataset.resources,
        program: null
    });
});

const shape = {
    data: {
        "type": "FeatureCollection",
        "features": [
            {
                "properties": {
                    "area_id": "MWI",
                    "area_level": 0,
                    "area_name": "Malawi",
                    "parent_area_id": null,
                    "area_sort_order": 1
                }
            },
            {
                "properties": {
                    "area_id": "MWI_1_1",
                    "area_level": 1,
                    "area_name": "Northern",
                    "parent_area_id": "MWI",
                    "area_sort_order": 2
                }
            },
            {
                "properties": {
                    "area_id": "MWI_2_1",
                    "area_level": 2,
                    "area_name": "Chitipa",
                    "parent_area_id": "MWI_1_1",
                    "area_sort_order": 3
                }
            },
            {
                "properties": {
                    "area_id": "MWI_2_2",
                    "area_level": 2,
                    "area_name": "Karonga",
                    "parent_area_id": "MWI_1_1",
                    "area_sort_order": 4
                }
            }
        ]
    },
    type: "shape",
    hash: "1234.csv",
    filename: "test.csv",
    filters: {
        level_labels: [{id: 1, area_level_label: "Country", display: true}],
        regions: {label: "Malawi", id: "1", children: []}
    }
} as ShapeResponse

const state = mockBaselineState({
    shape
});

it("areaIdToPropertiesMap returns map of area ID to properties", () => {
    const expected = {
        "MWI": {area_level: 0, area_name: "Malawi", area_sort_order: 1},
        "MWI_1_1": {area_level: 1, area_name: "Northern", area_sort_order: 2},
        "MWI_2_1": {area_level: 2, area_name: "Chitipa", area_sort_order: 3},
        "MWI_2_2": {area_level: 2, area_name: "Karonga", area_sort_order: 4}
    } as Dict<AreaProperties>
    expect(baselineGetters.areaIdToPropertiesMap(state)).toStrictEqual(expected);
})

const shapeEmptyProperties = {
    data: {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "feature",
                "geometry": {}
            },
            {
                "type": "feature",
                "geometry": {}
            }
        ]
    },
    type: "shape",
    hash: "1234.csv",
    filename: "test.csv",
    filters: {
        level_labels: [{id: 1, area_level_label: "Country", display: true}],
        regions: {label: "Malawi", id: "1", children: []}
    }
} as ShapeResponse

const stateEmptyProperties = mockBaselineState({
    shape: shapeEmptyProperties
});

it("areaIdToPropertiesMap returns empty if no shape data or properties", () => {
    let state = mockBaselineState();
    expect(baselineGetters.areaIdToPropertiesMap(state)).toStrictEqual({});

    expect(baselineGetters.areaIdToPropertiesMap(stateEmptyProperties)).toStrictEqual({});
});

it("can get area ID to area hierarchy path map", () => {
    const expected = {
        "MWI": [],
        "MWI_1_1": ["MWI"],
        "MWI_2_1": ["MWI", "MWI_1_1"],
        "MWI_2_2": ["MWI", "MWI_1_1"],
    } as Dict<string[]>
    expect(baselineGetters.areaIdToParentPath(state)).toStrictEqual(expected);

    expect(baselineGetters.areaIdToParentPath(stateEmptyProperties)).toStrictEqual({});
});
