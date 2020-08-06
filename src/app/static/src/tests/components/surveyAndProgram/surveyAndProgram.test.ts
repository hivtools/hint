import {testUploadComponent} from "./fileUploads";
import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import SurveyAndProgram from "../../../app/components/surveyAndProgram/SurveyAndProgram.vue";
import {
    mockAncResponse,
    mockBaselineState,
    mockPlottingSelections,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {DataType, SurveyAndProgramState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/surveyAndProgram/actions";
import {mutations} from "../../../app/store/surveyAndProgram/mutations";
import {getters} from "../../../app/store/surveyAndProgram/getters";
import {mutations as selectionsMutations} from "../../../app/store/plottingSelections/mutations";
import {ColourScaleSelections, ColourScaleType} from "../../../app/store/plottingSelections/plottingSelections";

const localVue = createLocalVue();

describe("Survey and programme component", () => {

    beforeAll(() => {
        Vue.config.silent = true;
    });

    afterAll(() => {
        Vue.config.silent = false;
    })

    testUploadComponent("surveys", 0);
    testUploadComponent("program", 1);
    testUploadComponent("anc", 2);

    const createStore = (surveyAndProgramState: Partial<SurveyAndProgramState> = {selectedDataType: DataType.Survey}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState(surveyAndProgramState),
                    mutations: mutations,
                    actions: actions,
                    getters: getters
                },
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        shape: {
                            data: {features: "TEST FEATURES" as any} as any,
                            filters: {
                                level_labels: "TEST LEVEL LABELS",
                                regions: {id: "country", children: [{id: "region 1"}, {id: "region 2"}]}
                            } as any
                        } as any
                    })
                },
                plottingSelections: {
                    namespaced: true,
                    state: mockPlottingSelections({
                        sapChoropleth: {selectedFilterOptions: "TEST SELECTIONS"} as any
                    }),
                    getters: {
                        selectedSAPColourScales: () => {
                            return {prevalence: {
                                    type: ColourScaleType.Custom,
                                    customMin: 1,
                                    customMax: 2
                                }} as ColourScaleSelections
                        }
                    },
                    mutations: selectionsMutations
                },
                metadata: {
                    namespaced: true,
                    getters: {
                        sapIndicatorsMetadata: () => {
                            return ["TEST INDICATORS"]
                        }
                    }
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders choropleth controls if there is a selected data type", () => {
        const store = createStore({selectedDataType: DataType.Survey});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
        expect(wrapper.findAll("filters-stub").length).toBe(1);
    });

    it("does not render choropleth controls if there is no selected data type", () => {
        const store = createStore({selectedDataType: null});
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});

        expect(wrapper.findAll("choropleth-stub").length).toBe(0);
        expect(wrapper.findAll("filters-stub").length).toBe(0);
    });

    it("renders choropleth as expected", () => {
        const store = createStore({
            selectedDataType: DataType.Survey,
            survey: {
                "data": "TEST DATA",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const choro = wrapper.find("choropleth-stub");
        expect(choro.props().includeFilters).toBe(false);
        expect(choro.props().areaFilterId).toBe("area");
        expect(choro.props().chartdata).toBe("TEST DATA");
        expect(choro.props().filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: [{id: "region 1"}, {id: "region 2"}]
        });
        expect(choro.props().filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: "TEST YEAR FILTERS"
        });
        expect(choro.props().features).toBe("TEST FEATURES");
        expect(choro.props().featureLevels).toBe("TEST LEVEL LABELS");
        expect(choro.props().indicators).toStrictEqual(["TEST INDICATORS"]);
        expect(choro.props().selections).toStrictEqual({selectedFilterOptions: "TEST SELECTIONS"});
        expect(choro.props().colourScales).toEqual({prevalence: {
            type: ColourScaleType.Custom,
                customMin: 1,
                customMax: 2
        }});

    });

    it("renders filters as expected", () => {
        const store = createStore({
            selectedDataType: DataType.Survey,
            survey: {
                "data": "TEST DATA",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const filters = wrapper.find("filters-stub");
        expect(filters.props().filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: [{id: "region 1"}, {id: "region 2"}]
        });
        expect(filters.props().filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: "TEST YEAR FILTERS"
        });
        expect(filters.props().selectedFilterOptions).toBe("TEST SELECTIONS");
    });

    it("updates state when choropleth selections change", async () => {
        const wrapper = shallowMount(SurveyAndProgram, {store: createStore(), localVue});
        (wrapper.vm as any).updateChoroplethSelections({payload: {selectedFilterOptions: "NEW TEST SELECTIONS"}});

        await Vue.nextTick();
        expect((wrapper.vm as any).plottingSelections).toStrictEqual({selectedFilterOptions: "NEW TEST SELECTIONS"});
    });

    it("tabs are disabled if no data is present", () => {
        const wrapper = shallowMount(SurveyAndProgram, {store: createStore(), localVue});
        expect(wrapper.findAll(".nav-item").length).toBe(3);
        expect(wrapper.findAll(".nav-item .nav-link.disabled").length).toBe(3);
    });

    it("survey tab is enabled when survey data is present", () => {
        expectTabEnabled({survey: mockSurveyResponse(), selectedDataType: DataType.Survey}, "Household Survey", 0);
    });

    it("programme (ART) tab is enabled when programme data is present", () => {
        expectTabEnabled({program: mockProgramResponse(), selectedDataType: DataType.Survey}, "ART", 1);
    });

    it("ANC tab is enabled when ANC data is present", () => {
        expectTabEnabled({anc: mockAncResponse(), selectedDataType: DataType.Survey}, "ANC Testing", 2);
    });

    function expectTabEnabled(state: Partial<SurveyAndProgramState>, name: string, index: number) {
        const store = createStore(state);
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.findAll(".nav-link").at(index).classes()).not.toContain("disabled");
        expect(wrapper.findAll(".nav-link").at(index).text()).toBe(name);
        expect(wrapper.findAll(".nav-link.disabled").length).toBe(2);
    }

    it("can change tabs", () => {
        const store = createStore(
            {
                anc: mockAncResponse(),
                survey: mockSurveyResponse(),
                program: mockProgramResponse(),
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect(wrapper.find(".nav-link.active").text()).toBe("ART");

        wrapper.findAll(".nav-link").at(2).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("ANC Testing");

        wrapper.findAll(".nav-link").at(0).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("Household Survey");

        wrapper.findAll(".nav-link").at(1).trigger("click");
        Vue.nextTick();
        expect(wrapper.find(".nav-link.active").text()).toBe("ART");

        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
    });

    it("computes selectedDataType", () => {
        const store = createStore(
            {
                anc: mockAncResponse(),
                survey: mockSurveyResponse(),
                program: mockProgramResponse(),
                selectedDataType: DataType.Program
            });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        expect((wrapper.vm as any).selectedDataType).toBe(DataType.Program);
    });

    it("renders table as expected", () => {
        const store = createStore({
            selectedDataType: DataType.Survey,
            survey: {
                "data": "TEST DATA",
                "filters": {
                    "year": "TEST YEAR FILTERS"
                }
            } as any,
        });
        const wrapper = shallowMount(SurveyAndProgram, {store, localVue});
        const table = wrapper.find("table-view-stub");
        expect(table.props().areaFilterId).toBe("area");
        expect(table.props().tabledata).toBe("TEST DATA");
        expect(table.props().filters[0]).toStrictEqual({
            id: "area",
            column_id: "area_id",
            label: "area",
            allowMultiple: true,
            options: [{id: "region 1"}, {id: "region 2"}]
        });
        expect(table.props().filters[1]).toStrictEqual({
            id: "year",
            column_id: "year",
            label: "year",
            allowMultiple: false,
            options: "TEST YEAR FILTERS"
        });
        expect(table.props().indicators).toStrictEqual(["TEST INDICATORS"]);
        expect(table.props().selections).toStrictEqual({selectedFilterOptions: "TEST SELECTIONS"});

    });

});

