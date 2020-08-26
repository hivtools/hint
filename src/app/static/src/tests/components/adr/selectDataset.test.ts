import Vuex from "vuex";
import Vue from "vue";
import {mount, shallowMount} from "@vue/test-utils";
import SelectDataset from "../../../app/components/adr/SelectDataset.vue";
import Modal from "../../../app/components/Modal.vue";
import TreeSelect from '@riophae/vue-treeselect'
import {mockBaselineState, mockRootState} from "../../mocks";
import {BaselineState} from "../../../app/store/baseline/baseline";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {BaselineMutation} from "../../../app/store/baseline/mutations";
import {BaselineActions} from "../../../app/store/baseline/actions";
import {SurveyAndProgramActions} from "../../../app/store/surveyAndProgram/actions";

describe("select dataset", () => {

    const fakeDatasets = [{
        id: "id1",
        title: "Some data",
        organization: {title: "org"},
        name: "some-data",
        revision_id: "456",
        type: "naomi-data"
    }]

    const fakeDataset = {
        id: "id1",
        title: "Some data",
        revision_id: "456",
        url: "www.adr.com/naomi-data/some-data"
    }

    const setDatasetMock = jest.fn();

    const baselineActions: Partial<BaselineActions> = {
        importShape: jest.fn(),
        importPopulation: jest.fn(),
        importPJNZ: jest.fn()
    }

    const surveyProgramActions: Partial<SurveyAndProgramActions> = {
        importSurvey: jest.fn(),
        importProgram: jest.fn(),
        importANC: jest.fn()
    }

    const getStore = (props: Partial<BaselineState> = {}) => {
        return new Vuex.Store({
            state: mockRootState({
                adrSchemas: {
                    baseUrl: "www.adr.com/",
                    anc: "anc",
                    programme: "prog",
                    pjnz: "pjnz",
                    population: "pop",
                    shape: "shape",
                    survey: "survey"
                },
                adrDatasets: fakeDatasets
            }),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(props),
                    actions: baselineActions,
                    mutations: {
                        [BaselineMutation.SetDataset]: setDatasetMock
                    }
                },
                surveyAndProgram: {
                    namespaced: true,
                    actions: surveyProgramActions
                }
            }
        });
    }

    it("renders select dataset button when no dataset is selected", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect(rendered.find("button").text()).toBe("Select ADR dataset");
    });

    it("renders edit dataset button when dataset is already selected", () => {
        const rendered = shallowMount(SelectDataset, {
            store: getStore({
                selectedDataset: fakeDataset
            })
        });
        expect(rendered.find("button").text()).toBe("Edit");
    });

    it("renders selected dataset if it exists", () => {
        const rendered = shallowMount(SelectDataset, {
            store: getStore({
                selectedDataset: fakeDataset
            })
        });
        expect(rendered.find(".font-weight-bold").text()).toBe("Selected dataset:");
        expect(rendered.find("a").text()).toBe("Some data");
        expect(rendered.find("a").attributes("href")).toBe("www.adr.com/naomi-data/some-data");
    });

    it("does not render selected dataset if it doesn't exist", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect(rendered.findAll(".font-weight-bold").length).toBe(0);
        expect(rendered.findAll("a").length).toBe(0);
    });

    it("can open modal", () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        expect(rendered.find(Modal).props("open")).toBe(false);
        rendered.find("button").trigger("click");
        expect(rendered.find(Modal).props("open")).toBe(true);
    });

    it("can close modal", () => {
        const rendered = mount(SelectDataset, {store: getStore(), stubs: ["tree-select"]});
        rendered.find("button").trigger("click");
        expect(rendered.find(Modal).props("open")).toBe(true);
        rendered.find(Modal).findAll("button").at(1).trigger("click");
        expect(rendered.find(Modal).props("open")).toBe(false);
    });

    it("renders select", async () => {
        const rendered = shallowMount(SelectDataset, {store: getStore()});
        rendered.find("button").trigger("click");
        const select = rendered.find(TreeSelect);
        expect(select.props("multiple")).toBe(false);
        expect(select.props("searchable")).toBe(true);

        const expectedOptions = [{
            id: "id1",
            label: "Some data",
            customLabel: `Some data
                    <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                        (some-data)<br/>
                        <span class="font-weight-bold">org</span>
                    </div>`
        }]
        expect(select.props("options")).toStrictEqual(expectedOptions);
    });

    it("sets current dataset", async (done) => {
        const rendered = mount(SelectDataset, {store: getStore(), sync: false, stubs: ["tree-select"]});
        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAll(TreeSelect).length).toBe(1);
        rendered.setData({newDatasetId: "id1"});
        rendered.find(Modal).find("button").trigger("click");

        await Vue.nextTick();
        expect(setDatasetMock.mock.calls[0][1]).toEqual(fakeDataset);

        // loading spinner should render and buttons temporarily disabled
        const buttons = rendered.find(Modal).findAll("button");
        expect(rendered.findAll(TreeSelect).length).toBe(0);
        expect(rendered.findAll(LoadingSpinner).length).toBe(1);
        expect(buttons.at(0).attributes("disabled")).toBe("disabled");
        expect(buttons.at(1).attributes("disabled")).toBe("disabled");

        setTimeout(() => {
            // loading spinner should clear and modal closed
            expect(rendered.findAll(LoadingSpinner).length).toBe(0);
            expect(rendered.find(Modal).props("open")).toBe(false);
            done();
        }, 200)
    });

});
