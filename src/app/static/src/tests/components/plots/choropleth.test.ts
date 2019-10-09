import {createLocalVue, shallowMount} from '@vue/test-utils';
import Choropleth from "../../../app/components/plots/Choropleth.vue";
import Vue from "vue";
import Vuex from "vuex";
import {mockBaselineState, mockFilteredDataState, mockShapeResponse} from "../../mocks";
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
        "MWI.1.1.1.1": {
            prev: {value: 0.1, color: "rgb(1,1,1)"},
            art: {value: 0.08, color: "rgb(2,2,2)"}
            },
        "MWI.1.1.1.2": {
            prev: {value: 0.05, color: "rgb(3,3,3)"},
            art: {value: 0.06, color: "rgb(4,4,4)"}
        },
        "MWI.1.1.1": {
            prev: {value: 0.07, color: "rgb(5,5,5)"},
            art:{value: 0.2, color: "rgb(6,6,6)" }
        }
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
        },
        choroplethRanges: () => {
            return {
                prev: {min: 0, max: 0.5},
                art: {min: 0.1, max: 1}
            };
        }
    };

    const testColorFunctions = () => {
        return {
            prev: jest.fn(),
            art: jest.fn()
        }
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
                                    name: "test country"
                                }
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
                                regions: [{id: "MWI.1.1.1", name: "Test Region"}],
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
                }
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

    it("calculates range according to indicator", () => {
        //default to prev
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.range.min).toBe(0);
        expect(vm.range.max).toBe(0.5);

        //update to ART
        wrapper.find(MapControl).vm.$emit("indicator-changed", "art");

        Vue.nextTick();

        expect(vm.range.min).toBe(0.1);
        expect(vm.range.max).toBe(1);
    });

    it("calculates indicators from filteredData", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.regionIndicators).toEqual(testRegionIndicators);
    });

    it("calculates prevEnabled and artEnabled when true", () => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.prevEnabled).toBe(true);
        expect(vm.artEnabled).toBe(true);
    });

    it("calculates artEnabled when false", () => {
        const emptyStore = new Vuex.Store({
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
                    state: mockFilteredDataState({selectedDataType: DataType.ANC}),
                    getters: testGetters
                }
            }
        });
        const wrapper = shallowMount(Choropleth, {store: emptyStore, localVue});

        const vm = wrapper.vm as any;
        expect(vm.artEnabled).toBe(false);
    });

    it("calculates prevEnabled when false", () => {
        const emptyStore = new Vuex.Store({
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
                    state: mockFilteredDataState({selectedDataType: DataType.Program}),
                    getters: testGetters
                }
            }
        });
        const wrapper = shallowMount(Choropleth, {store: emptyStore, localVue});

        const vm = wrapper.vm as any;
        expect(vm.prevEnabled).toBe(false);
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

    it("updates colors when the indicator changes", (done) => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            const expectedColor = "rgb(2,2,2)";
            wrapper.find(MapControl).vm.$emit("indicator-changed", "art");
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

    it("updates indicator to prev if necessary when selectedDataType changes", () => {
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
                }
            }
        });
        const wrapper = shallowMount(Choropleth, {store: testStore, localVue});
        const vm = wrapper.vm as any;
        vm.indicator = "art";

        testStore.commit({type: "filteredData/SelectedDataTypeUpdated", payload: DataType.ANC});
        expect(vm.indicator).toBe("prev");
    });

    it("options onEachFeature returns function which generates correct tooltip", () => {

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
                                area_1: {prev: {value: 1}},
                                area_2: {prev: {value: 2}}
                            }
                        },
                    },
                    mutations: mutations
                }
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

        testStore.commit({type: "filteredData/ChoroplethFilterUpdated",
                            payload: [FilterType.Region, [{id: "MWI.1.1.1.2", name: "test area"}]]});

        setTimeout(() => {
            expect(mockUpdateBounds.mock.calls.length).toBe(1);
            done();
        });
    });

    it("selectedRegionFeatures gets selected region features", () => {
        const testStore = getTestStore({
            selectedChoroplethFilters: {
                regions: [{id: "MWI.1.1.1.1", name: "area1"}, {id: "MWI.1.1.1.2", name: "area2"}],
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

