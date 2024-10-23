import Vuex, {ActionTree} from "vuex";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {
    mockADRDatasetState,
    mockADRDataState,
    mockADRState,
    mockDatasetResource,
    mockError,
    mockProjectsState,
    mockRootState
} from "../../mocks";
import {shallowMountWithTranslate} from "../../testHelpers";
import {ADRDatasetState, AdrDatasetType, ADRState} from "../../../app/store/adr/adr";
import ADRRehydrate from "../../../app/components/adr/ADRRehydrate.vue";
import SelectDatasetModal from "../../../app/components/adr/SelectDatasetModal.vue";
import {ADRActions} from "../../../app/store/adr/actions";
import {RootState} from "../../../app/root";
import {nextTick} from "vue";

describe("ADRRehydrate", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const mockOutputDataset = mockADRDatasetState()

    const mockGetDatasets = vi.fn();
    const mockGetDataset = vi.fn();

    const createStore = (outputDataset: ADRDatasetState = mockOutputDataset) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState({
                        adrRehydrateOutputZip: mockDatasetResource()
                    })
                },
                adr: {
                    namespaced: true,
                    state: mockADRState({
                        adrData: mockADRDataState({
                            [AdrDatasetType.Output]: outputDataset
                        })
                    }),
                    actions: {
                        getDatasets: mockGetDatasets,
                        getDataset: mockGetDataset
                    } as Partial<ADRActions> & ActionTree<ADRState, RootState>,
                },
            },
        });
        registerTranslations(store);
        return store;
    };

    const getWrapper = (store = createStore()) => {
        return shallowMountWithTranslate(ADRRehydrate, store, {
            global: {
                plugins: [store]
            },
            props: {
                openModal: true
            },
        });
    };

    it("renders as expected and fetches datasets on mount", () => {
        const wrapper = getWrapper();

        const selectDataset = wrapper.findComponent(SelectDatasetModal);
        expect(selectDataset.isVisible()).toBeTruthy();
        const props = selectDataset.props() as any;
        expect(props.datasetType).toBe(AdrDatasetType.Output);
        expect(props.open).toBeTruthy();
        expect(props.loading).toBeFalsy();
        expect(mockGetDatasets).toHaveBeenCalledTimes(1);
        expect(mockGetDatasets.mock.calls[0][1]).toBe(AdrDatasetType.Output);
    });

    it("importOutputZip dispatches getDataset and triggers submitCreate", async () => {
        const wrapper = getWrapper();

        const selectDataset = wrapper.findComponent(SelectDatasetModal);
        await selectDataset.vm.$emit("confirm-import", "123", null);
        await nextTick();

        expect(mockGetDataset).toHaveBeenCalledTimes(1);
        expect(mockGetDataset.mock.calls[0][1]).toStrictEqual({
            id: "123",
            release: null,
            datasetType: AdrDatasetType.Output
        });
        expect(wrapper.emitted()["submit-create"].length).toBe(1);
    });

    it("importOutputZip doesn't submitCreate if error from fetching", async () => {
        const mockOutputDataset = mockADRDatasetState({
            fetchingError: mockError("error")
        });
        const store = createStore(mockOutputDataset);
        const wrapper = getWrapper(store);

        const selectDataset = wrapper.findComponent(SelectDatasetModal);
        await selectDataset.vm.$emit("confirm-import", "123", null);
        await nextTick();

        expect(mockGetDataset).toHaveBeenCalledTimes(1);
        expect(mockGetDataset.mock.calls[0][1]).toStrictEqual({
            id: "123",
            release: null,
            datasetType: AdrDatasetType.Output
        });
        expect(wrapper.emitted()).not.toHaveProperty("submit-create");
    });

    it("calls cancelCreate when close-modal event is handled", async () => {
        const wrapper = getWrapper();

        const selectDataset = wrapper.findComponent(SelectDatasetModal);
        await selectDataset.vm.$emit("close-modal");

        expect(wrapper.emitted()["cancel-create"].length).toBe(1);
    });
});
