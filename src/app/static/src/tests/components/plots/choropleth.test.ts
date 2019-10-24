import {createLocalVue, shallowMount} from '@vue/test-utils';
import Choropleth from "../../../app/components/plots/Choropleth.vue";
import Vue from "vue";
import Vuex from "vuex";
import {mockBaselineState, mockFilteredDataState, mockMetadataState, mockShapeResponse} from "../../mocks";
import {LGeoJson} from 'vue2-leaflet';
import MapControl from "../../../app/components/plots/MapControl.vue";
import {mutations} from "../../../app/store/filteredData/mutations";
import {
    DataType,
    FilteredDataState,
    FilterType,
    initialFilteredDataState
} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Choropleth component", () => {

    const fakeFeatures = [
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.1"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.1.1"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "type": "Feature",
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.1.2"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        }
    ];
    const testRegionIndicators = {
        "MWI.1.1.1.1": {value: 0.1, color: "rgb(1,1,1)"},
        "MWI.1.1.1.2": {value: 0.05, color: "rgb(3,3,3)"},
        "MWI.1.1.1": {value: 0.07, color: "rgb(5,5,5)"}
    };

    const testGetters = {
        regionIndicators: () => {
            return testRegionIndicators;
        },
        colorFunctions: () => {
            return {
                prev: jest.fn(),
                art: jest.fn()
            }
        }
    };

    const testMetadataGetters = {
        choroplethIndicators: () => {
            return ["prev", "art"];
        },
        choroplethIndicatorsMetadata: () => {
            return [
                {indicator: "prev", name: "Prevalence", min: 0, max: 0.5},
                {indicator: "art", name: "ART Coverage", min: 0.1, max: 1}
            ];
        }
    };

    const testMetadataModule = {
        namespaced: true,
        getters: testMetadataGetters
    };

    function getTestStore(filteredDataProps?: Partial<FilteredDataState>) {
        return new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        shape: mockShapeResponse({
                            data: {features: fakeFeatures} as any,
                            filters: {
                                regions: {
                                    id: "MWI.1.1.1",
                                    label: "test country"
                                },
                                level_labels: [
                                    {id: 3, display: true, area_level_label: "Admin Level 3"},
                                    {id: 4, display: true, area_level_label: "Admin Level 4"}
                                ]
                            } as any
                        })
                    })
                },
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(
                        {
                            selectedDataType: DataType.Survey,
                            selectedChoroplethFilters: {
                                regions: ["MWI.1.1.1"],
                                sex: null,
                                age: null,
                                survey: null,
                                quarter: null
                            },
                            ...filteredDataProps
                        }),
                    getters: testGetters,
                    actions,
                    mutations
                },
                metadata: testMetadataModule
            }
        });
    }

    const store = getTestStore();

    it("gets features from store and renders those with the right admin level", (done) => {
        // admin level is hard-coded to 5
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            expect(wrapper.findAll(LGeoJson).length).toBe(2);
            done();
        })
    });

    it("calculates indicatorMetadata according to indicator", () => {
        //default to prev
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.indicatorMetadata.indicator).toBe("prev");
        expect(vm.indicatorMetadata.name).toBe("Prevalence");
        expect(vm.indicatorMetadata.min).toBe(0);
        expect(vm.indicatorMetadata.max).toBe(0.5);

        //update to ART
        wrapper.find(MapControl).vm.$emit("indicator-changed", "art");

        Vue.nextTick();

        expect(vm.indicatorMetadata.indicator).toBe("art");
        expect(vm.indicatorMetadata.name).toBe("ART Coverage");
        expect(vm.indicatorMetadata.min).toBe(0.1);
        expect(vm.indicatorMetadata.max).toBe(1);
    });

    it("calculates indicators from filteredData", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.regionIndicators).toEqual(testRegionIndicators);
    });

    it("calculates featuresByLevel", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});
        const vm = wrapper.vm as any;

        expect(vm.featuresByLevel).toStrictEqual(
            {
                3: [{id: fakeFeatures[0].properties.area_id, feature: fakeFeatures[0]}],
                4: [{id: fakeFeatures[1].properties.area_id, feature: fakeFeatures[1]},
                    {id: fakeFeatures[2].properties.area_id, feature: fakeFeatures[2]}]
            }
        );
    });

    it("sets initial detail to max level", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});
        const vm = wrapper.vm as any;

        expect(vm.detail).toBe(4);
    });

    it("countryFeature gets top level region", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});
        const vm = wrapper.vm as any;
        expect(vm.countryFeature).toStrictEqual(fakeFeatures[0]);
    });

    it("can get feature from area id", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});
        const vm = wrapper.vm as any;
        const feature = vm.getFeatureFromAreaId("MWI.1.1.1.2");
        expect(feature).toStrictEqual(fakeFeatures[2]);
    });

    it("colors features according to indicator", (done) => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            const expectedColor = "rgb(1,1,1)";
            expect(wrapper.findAll(LGeoJson).at(0).props("optionsStyle").fillColor).toBe(expectedColor);
            done();
        })
    });

    it("updates features shown when the detail control changes", (done) => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            wrapper.find(MapControl).vm.$emit("detail-changed", 1);
            expect(wrapper.findAll(LGeoJson).length).toBe(0);
            done();
        })
    });

    it("updates indicator if necessary when selectedDataType changes", () => {
        //defaults to prev, should get updated to art on data type change if no prev data
        const filteredData = {...initialFilteredDataState};
        const testStore = new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        shape: mockShapeResponse({
                            data: {features: fakeFeatures} as any
                        })
                    })
                },
                filteredData: {
                    namespaced: true,
                    state: filteredData,
                    getters: testGetters,
                    mutations: mutations
                },
                metadata: testMetadataModule
            }
        });
        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});
        const vm = wrapper.vm as any;
        vm.indicator = "nonexistent";

        testStore.commit({type: "filteredData/SelectedDataTypeUpdated", payload: DataType.Output});
        expect(vm.indicator).toBe("prev");
    });

    it("options are empty if no indicators", () => {
        const testStore = new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        shape: mockShapeResponse()
                    })
                },
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    getters: {
                        ...testGetters,
                    }
                },
                metadata: {
                    namespaced: true,
                    state: mockMetadataState(),
                    getters: {
                        choroplethIndicatorsMetadata: () => [],
                        choroplethIndicators: () => []
                    }
                }
            }
        });
        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});
        const vm = wrapper.vm as any;
        const options = vm.options;

        expect(options).toStrictEqual({});
    });

    it("options onEachFeature returns function which generates correct tooltips", () => {

        const filteredData = {...initialFilteredDataState};
        const testStore = new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        shape: mockShapeResponse({
                            data: {features: fakeFeatures} as any
                        })
                    })
                },
                filteredData: {
                    namespaced: true,
                    state: filteredData,
                    getters: {
                        ...testGetters,
                        regionIndicators: () => {
                            return {
                                area_1: {value: 1},
                                area_2: {value: 0}
                            }
                        },
                    },
                    mutations: mutations
                },
                metadata: testMetadataModule
            }
        });
        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});
        const vm = wrapper.vm as any;
        const options = vm.options;
        const onEachFeatureFunction = options.onEachFeature;

        const mockLayer = {
            bindPopup: jest.fn()
        };

        const mockFeature = {
            properties: {
                area_id: "area_1",
                area_name: "Area 1"
            }
        };

        onEachFeatureFunction(mockFeature, mockLayer);
        expect(mockLayer.bindPopup.mock.calls[0][0]).toEqual(`<div>
                            <strong>Area 1</strong>
                            <br/>1
                        </div>`);

        const mockZeroValueFeature = {
            properties: {
                area_id: "area_2",
                area_name: "Area 2"
            }
        };

        onEachFeatureFunction(mockZeroValueFeature, mockLayer);
        expect(mockLayer.bindPopup.mock.calls[1][0]).toEqual(`<div>
                            <strong>Area 2</strong>
                            <br/>0
                        </div>`);

    });

    it("updateBounds updates bounds of map from selected region geojson", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});
        const mockMapFitBounds = jest.fn();

        const vm = wrapper.vm as any;
        vm.$refs.map = {
            fitBounds: mockMapFitBounds
        };

        vm.updateBounds();
        expect(mockMapFitBounds.mock.calls[0][0]).toStrictEqual(
            [{"_northEast": {"lat": -15.2047, "lng": 35.7117}, "_southWest": {"lat": -15.2117, "lng": 35.7083}}]);
    });

    it("invokes updateBounds when selected region changes", (done) => {
        const testStore = getTestStore();
        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});

        const vm = wrapper.vm as any;
        const mockUpdateBounds = jest.fn();
        vm.updateBounds = mockUpdateBounds;

        testStore.commit({
            type: "filteredData/ChoroplethFilterUpdated",
            payload: [FilterType.Region, [{id: "MWI.1.1.1.2", label: "test area"}]]
        });

        setTimeout(() => {
            expect(mockUpdateBounds.mock.calls.length).toBe(1);
            done();
        });
    });

    it("selectedRegionFeatures gets selected region features", () => {
        const testStore = getTestStore({
            selectedChoroplethFilters: {
                regions: ["MWI.1.1.1.1", "MWI.1.1.1.2"],
                sex: null,
                age: null,
                survey: null,
                quarter: null
            }
        });

        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});
        const vm = wrapper.vm as any;

        const result = vm.selectedRegionFeatures;
        expect(result).toStrictEqual([fakeFeatures[1], fakeFeatures[2]]);
    });

    it("selectedRegionFeatures gets top level region feature when no region is selected", () => {
        const testStore = getTestStore({
            selectedChoroplethFilters: {
                regions: [],
                sex: null,
                age: null,
                survey: null,
                quarter: null
            }
        });
        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});
        const vm = wrapper.vm as any;

        const result = vm.selectedRegionFeatures;
        expect(result).toStrictEqual([fakeFeatures[0]]);
    });

});

