import {baselineGetters} from "../../app/store/baseline/baseline";
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
import {ShapeResponse} from "../../app/generated";
import {Dict} from "../../app/types";
import {AdrDatasetType} from "../../app/store/adr/adr";

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
                    "parent_area_id": null
                }
            },
            {
                "properties": {
                    "area_id": "MWI_1_1",
                    "area_level": 1,
                    "area_name": "Northern",
                    "parent_area_id": "MWI"
                }
            },
            {
                "properties": {
                    "area_id": "MWI_2_1",
                    "area_level": 2,
                    "area_name": "Chitipa",
                    "parent_area_id": "MWI_1_1"
                }
            },
            {
                "properties": {
                    "area_id": "MWI_2_2",
                    "area_level": 2,
                    "area_name": "Karonga",
                    "parent_area_id": "MWI_1_1"
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

it("areaIdToLevelMap returns map of area ID to level", () => {
    const expected = {
        "MWI": 0,
        "MWI_1_1": 1,
        "MWI_2_1": 2,
        "MWI_2_2": 2
    } as Dict<number>
    expect(baselineGetters.areaIdToLevelMap(state)).toStrictEqual(expected);
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

it("areaIdToLevelMap returns empty if no shape data or properties", () => {
    let state = mockBaselineState();
    expect(baselineGetters.areaIdToLevelMap(state)).toStrictEqual({});

    expect(baselineGetters.areaIdToLevelMap(stateEmptyProperties)).toStrictEqual({});
});

it("can get area id to area name map", () => {
    const expected = {
        "MWI": "Malawi",
        "MWI_1_1": "Northern",
        "MWI_2_1": "Chitipa",
        "MWI_2_2": "Karonga"
    } as Dict<string>
    expect(baselineGetters.areaIdToAreaName(state)).toStrictEqual(expected);

    expect(baselineGetters.areaIdToAreaName(stateEmptyProperties)).toStrictEqual({});
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

it('ageGroupOptions returns an array of possible age group', ()=> {
    const metadata = {
            filterTypes: [
                {
                    id: 'age', 
                    column_id: 'age_group', 
                    options: [
                        {id:"Y000_004",label:"0-4"},
                        {id:"Y005_009",label:"5-9"},
                        {id:"Y010_014",label:"10-14"}
                    ]}
            ],
            indicators: [],
            plotSettingsControl: {
                population: {
                    plotSettings: []
                },
            }
    }

    const population = mockPopulationResponse({metadata});

    const state = mockBaselineState({population});

    const expected = [
        {id:"Y010_014",label:"10-14"},
        {id:"Y005_009",label:"5-9"},
        {id:"Y000_004",label:"0-4"}
    ];

    expect(baselineGetters.ageGroupOptions(state)).toStrictEqual(expected);
})

it('ageGroupOptions returns an empty array if no age options', ()=> {
    const metadata = {
        filterTypes: [
            {
                id: 'year',
                column_id: 'year',
                options: [
                    {id:"2000",label:"2000"}
                ]}
        ],
        indicators: [],
        plotSettingsControl: {
            population: {
                plotSettings: []
            },
        }
    }

    const population = mockPopulationResponse({metadata});
    const state = mockBaselineState({population});

    expect(baselineGetters.ageGroupOptions(state)).toStrictEqual([]);
});
