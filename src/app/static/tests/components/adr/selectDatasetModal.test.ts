import SelectRelease from "../../../src/components/adr/SelectRelease.vue";
import {expectHasTranslationKey, expectTranslatedWithStoreType, mountWithTranslate} from "../../testHelpers";
import SelectDatasetModal from "../../../src/components/adr/SelectDatasetModal.vue";
import {AdrDatasetType, ADRState} from "../../../src/store/adr/adr";
import {nextTick} from "vue";
import TreeSelect from "@reside-ic/vue3-treeselect";
import {
    mockADRDatasetState,
    mockADRDataState,
    mockADRState,
    mockBaselineState,
    mockDatasetResource,
    mockError,
    mockRootState
} from "../../mocks";
import HintTreeSelect from "../../../src/components/HintTreeSelect.vue";
import LoadingSpinner from "../../../src/components/LoadingSpinner.vue";
import {BaselineState} from "../../../src/store/baseline/baseline";
import Vuex, {Store} from "vuex";
import registerTranslations from "../../../src/store/translations/registerTranslations";
import {RootState} from "../../../src/root";
import Modal from "../../../src/components/Modal.vue";
import {ADRMutation} from "../../../src/store/adr/mutations";
import {mount} from "@vue/test-utils";

describe("select dataset modal", () => {

    const mockTranslate = vi.fn();
    const mockLocationReload = vi.fn();

    const win = window as any;
    const realLocation = win.location;

    beforeAll(() => {
        delete win.location;
        win.location = {reload: mockLocationReload};
    });

    afterAll(() => {
        win.location = realLocation;
    });

    const fakeDataset = {
        id: "id1",
        title: "Some data",
        url: "www.adr.com/naomi-data/some-data",
        organization: {title: "org", id: "org-id"},
        name: "some-data",
        type: "naomi-data",
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null,
            vmmc: null
        }
    };

    const fakeDataset2 = {
        id: "id2",
        title: "Some data 2",
        url: "www.adr.com/naomi-data/some-data",
        organization: {title: "org", id: "org-id"},
        name: "some-data",
        type: "naomi-data",
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: mockDatasetResource({
                id: "2",
                url: "shape.geojson",
                lastModified: "2020-11-03",
                metadataModified: "2020-11-04",
                name: "Shape Resource"
            }),
            anc: null,
            vmmc: null
        }
    };

    const fakeDatasets = [fakeDataset, fakeDataset2]

    const fakeRelease = {
        id: "1.0",
        name: "release1",
        notes: "some notes",
        activity_id: "activityId",
    };

    const mockDispatch = vi.fn();

    const getStore = (baselineState: Partial<BaselineState> = {}, adrData: Partial<ADRState["adrData"]> = {}) => {
        const allAdrData = mockADRDataState({
            [AdrDatasetType.Input]: mockADRDatasetState({
                datasets: fakeDatasets,
                releases: [fakeRelease],
            }),
            ...adrData
        })
        const store = new Vuex.Store({
            state: mockRootState({
                baseline: mockBaselineState(baselineState),
                adr: mockADRState({
                    adrData: allAdrData
                })
            }),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(baselineState)
                },
                adr: {
                    namespaced: true,
                    state: mockADRState({
                        adrData: allAdrData
                    }),
                    actions: {
                        getReleases: vi.fn()
                    },
                    mutations: {
                        [ADRMutation.ClearReleases]: vi.fn(),
                        [ADRMutation.SetReleases]: vi.fn()
                    }
                }
            },
        });
        store.dispatch = mockDispatch;
        registerTranslations(store);
        return store;
    }

    const mountSelectDataset = (store: Store<RootState>, datasetType = AdrDatasetType.Input) => {
        return mount(SelectDatasetModal, {
            global: {
                plugins: [store],
                directives: {
                    translate: mockTranslate
                },
            },
            propsData: {
                datasetType: datasetType,
                open: true
            },
        });
    };

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("passes open prop to modal", async () => {
        const store = getStore();
        const wrapper = mountSelectDataset(store);
        expect((wrapper.findComponent(Modal).props() as any).open).toBeTruthy();

        await wrapper.setProps({open: false} as any);
        expect((wrapper.findComponent(Modal).props() as any).open).toBeFalsy();
    });

    it("renders select dataset dropdown", async () => {
        const store = getStore();
        const wrapper = mountSelectDataset(store);
        const select = wrapper.findComponent(HintTreeSelect);
        expect((select.props() as any).multiple).toBe(false);

        const expectedOptions = [
            {
                id: "id1",
                label: "Some data",
                customLabel: `Some data
                            <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                                (some-data)<br/>
                                <span class="fw-bold">org</span>
                            </div>`
            },
            {
                id: "id2",
                label: "Some data 2",
                customLabel: `Some data 2
                            <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                                (some-data)<br/>
                                <span class="fw-bold">org</span>
                            </div>`
            }
        ]

        expect((select.props() as any).options).toStrictEqual(expectedOptions);
    });

    it("shows current dataset in dropdown if in known datasets", async () => {
        const store = getStore({selectedDataset: fakeDataset}, {
            [AdrDatasetType.Input]: mockADRDatasetState({
                datasets: [fakeDataset, fakeDataset2],
            })
        });
        const wrapper = mountSelectDataset(store);

        expect((wrapper.findComponent(HintTreeSelect).props() as any)["modelValue"]).toBe(fakeDataset.id);
    });

    it("current dataset is not preselected if there is no selectedDataset", async () => {
        const store = getStore();
        const wrapper = mountSelectDataset(store);

        expect((wrapper.findComponent(HintTreeSelect).props() as any)["modelValue"]).toBe(null);
    });

    it("current dataset not shown if this is an import output zip modal", async () => {
        const store = getStore({selectedDataset: fakeDataset}, {
            [AdrDatasetType.Output]: mockADRDatasetState({
                datasets: [fakeDataset, fakeDataset2],
            })
        });
        const wrapper = mountSelectDataset(store, AdrDatasetType.Output);

        expect((wrapper.findComponent(HintTreeSelect).props() as any)["modelValue"]).toBe(null);
    });

    it("current dataset is preselected if datasets change", async () => {
        const store = getStore({selectedDataset: fakeDataset2}, {
            [AdrDatasetType.Input]: mockADRDatasetState({
                datasets: [fakeDataset],
                fetchingError: mockError("error text")
            })
        });
        const wrapper = mountSelectDataset(store);

        expect((wrapper.findComponent(HintTreeSelect).props() as any)["modelValue"]).toBe(null);
        store.state.adr.adrData[AdrDatasetType.Input].datasets = fakeDatasets
        await nextTick();
        expect((wrapper.findComponent(HintTreeSelect).props() as any)["modelValue"]).toBe("id2");

        // Release were fetched
        expect(mockDispatch.mock.calls).toHaveLength(1);
        expect(mockDispatch.mock.calls[0][0]).toBe("adr/getReleases")
        expect(mockDispatch.mock.calls[0][1]).toStrictEqual({id: "id2", datasetType: AdrDatasetType.Input})
    });

    it("renders select release", async () => {
        const store = getStore({selectedDataset: fakeDataset2});
        const wrapper = mountSelectDataset(store);

        const selectRelease = wrapper.findComponent(SelectRelease)
        expect((selectRelease.props() as any).datasetId).toBe("id2");
        expect((selectRelease.props() as any).open).toBe(true);
    });

    it("renders message and button on error fetching datasets", async () => {
        const store = getStore({}, {
            [AdrDatasetType.Input]: mockADRDatasetState({
                datasets: [],
                fetchingError: mockError("error text")
            })
        });
        const wrapper = mountSelectDataset(store);

        expect(wrapper.vm.open).toBe(true);
        expect(wrapper.find("#fetch-error div").text()).toBe("error text");
        await expectHasTranslationKey(wrapper.find("#fetch-error button"), mockTranslate, "tryAgain");

        // Trying again disaptches action
        await wrapper.find("#fetch-error button").trigger("click");
        expect(mockDispatch.mock.calls).toHaveLength(1);
        expect(mockDispatch.mock.calls[0][0]).toBe("adr/getDatasets")
        expect(mockDispatch.mock.calls[0][1]).toBe(AdrDatasetType.Input)
    });

    it("hides fetching dataset controls, and enables TreeSelect, when not fetching", () => {
        const store = getStore();
        const wrapper = mountSelectDataset(store);
        expect(wrapper.find("#fetching-datasets").classes()).toStrictEqual(["invisible"]);
        expect((wrapper.findComponent(TreeSelect).attributes("disabled"))).toBeUndefined();
    });

    it("shows fetching dataset controls, and disables TreeSelect, when fetching", async () => {
        const store = getStore({}, {
            [AdrDatasetType.Input]: mockADRDatasetState({
                datasets: [],
                fetchingDatasets: true
            })
        });
        const wrapper = mountSelectDataset(store);
        expect(wrapper.find("#fetching-datasets").classes()).toStrictEqual(["visible"]);
        expect((wrapper.findComponent(TreeSelect).attributes("disabled"))).toBeUndefined();

        expect((wrapper.find("#fetching-datasets").findComponent(LoadingSpinner).props() as any).size).toBe("xs");
        await expectHasTranslationKey(wrapper.find("#fetching-datasets span"), mockTranslate, "loadingDatasets");
    });

    it("disables import button if no dataset selected", async () => {
        const store = getStore({selectedDataset: null});
        const wrapper = mountSelectDataset(store);

        expect((wrapper.find("button").element as HTMLButtonElement).disabled).toBe(true);
    });

    it("disables import button if release not valid", async () => {
        const store = getStore({selectedDataset: fakeDataset2});
        const wrapper = mountSelectDataset(store);

        const importButton = wrapper.find("button").element as HTMLButtonElement
        expect(importButton.disabled).toBeFalsy();

        const selectRelease = wrapper.findComponent(SelectRelease);
        await selectRelease.vm.$emit("valid", false);
        expect(importButton.disabled).toBeTruthy();

        await selectRelease.vm.$emit("valid", true);
        expect(importButton.disabled).toBeFalsy();
    });

    it("emits confirmImport event when the import button is clicked without release", async () => {
        const store = getStore({selectedDataset: fakeDataset2});
        const wrapper = mountSelectDataset(store);

        const button = wrapper.find("#importBtn");
        await button.trigger("click");

        expect(wrapper.emitted()).toHaveProperty("confirmImport");
        expect(wrapper.emitted().confirmImport).toHaveLength(1);
        expect(wrapper.emitted().confirmImport[0]).toStrictEqual([fakeDataset2.id, undefined]);
    });

    it("emits confirmImport event with a release if selected", async () => {
        const store = getStore({selectedDataset: fakeDataset2});
        const wrapper = mountSelectDataset(store);

        const selectRelease = wrapper.findComponent(SelectRelease)
        await selectRelease.vm.$emit("selected-dataset-release", fakeRelease);

        const button = wrapper.find("#importBtn");
        await button.trigger("click");

        expect(wrapper.emitted()).toHaveProperty("confirmImport");
        expect(wrapper.emitted().confirmImport).toHaveLength(1);
        expect(wrapper.emitted().confirmImport[0]).toStrictEqual([fakeDataset2.id, fakeRelease]);
    });

    it("sets labels based on dataset type", async () => {
        const store = getStore({selectedDataset: fakeDataset2});
        const wrapper = mountSelectDataset(store);

        await expectHasTranslationKey(wrapper.find("#select-dataset-label"), mockTranslate, "datasets");
        await expectHasTranslationKey(wrapper.find("#select-release-label"), mockTranslate, "releases");

        const storeOutput = getStore({selectedDataset: fakeDataset}, {
            [AdrDatasetType.Output]: mockADRDatasetState({
                datasets: [fakeDataset, fakeDataset2],
                releases: [fakeRelease]
            })
        });
        const wrapperOutput = mountSelectDataset(storeOutput, AdrDatasetType.Output);

        const selectedRelease = wrapperOutput.findComponent(SelectRelease);
        await expectHasTranslationKey(wrapperOutput.find("#select-dataset-label"), mockTranslate, "datasetsWithOutputZip");
        expect(selectedRelease.props().selectorLabelKey).toBe("releasesWithOutputZip");
    });
})
