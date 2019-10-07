import {createLocalVue, shallowMount} from '@vue/test-utils';
import Choropleth from "../../../app/components/plots/Choropleth.vue";
import Vue from "vue";
import Vuex from "vuex";
import {mockBaselineState, mockFilteredDataState, mockShapeResponse} from "../../mocks";
import {LGeoJson} from 'vue2-leaflet';
import MapControl from "../../../app/components/plots/MapControl.vue";
import {mutations} from "../../../app/store/filteredData/mutations";
import {DataType, initialFilteredDataState} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Choropleth component", () => {

    const fakeFeatures = [
        {
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.1"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.1.1"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
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

    const store = new Vuex.Store({
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
                state: mockFilteredDataState({selectedDataType: DataType.Survey}),
                getters: testGetters,
                actions
            }
        }
    });

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

    it("calculates prevtEnabled when false", () => {
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

});

