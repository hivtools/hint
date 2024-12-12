import {mount, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import {
    mockADRState,
    mockADRUploadState,
    mockDownloadResultsState,
    mockModelCalibrateState,
} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated, mountWithTranslate, shallowMountWithTranslate} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import {DownloadResultsState} from "../../../app/store/downloadResults/downloadResults";
import {ADRState} from "../../../app/store/adr/adr";
import {ADRUploadState} from "../../../app/store/adrUpload/adrUpload";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import { DownloadType } from '../../../app/store/downloadResults/downloadConfig';
import DownloadTableRow from '../../../app/components/downloadResults/DownloadTableRow.vue';

const mockPrepareAllOutputs = vi.fn();

const switches: Record<DownloadType, boolean> = {
    Summary: true,
    Comparison: true,
    Spectrum: true,
    CoarseOutput: true,
    Datapack: true,
};

const createStore = (adr: Partial<ADRState> = {userCanUpload: true},
                     getUserCanUpload = vi.fn(),
                     adrUploadState: Partial<ADRUploadState> = {},
                     downloadResults?: Partial<DownloadResultsState>,
                     clearStatus = vi.fn()) => {
    const store = new Vuex.Store({
        state: emptyState(),
        modules: {
            modelCalibrate: {
                namespaced: true,
                state: mockModelCalibrateState({calibrateId: "testId"}),
            },
            adr: {
                namespaced: true,
                state: mockADRState(adr),
                actions: {
                    getUserCanUpload
                }
            },
            adrUpload: {
                namespaced: true,
                state: mockADRUploadState({
                    ...adrUploadState,
                    currentFileUploading: 1,
                    totalFilesUploading: 2
                }),
                actions: {
                    getUploadFiles: vi.fn()
                },
                mutations: {
                    ClearStatus: clearStatus
                }
            },
            downloadResults: {
                namespaced: true,
                state: mockDownloadResultsState(downloadResults),
                actions: {
                    prepareAllOutputs: mockPrepareAllOutputs
                }
            }
        }
    });
    registerTranslations(store);
    return store;
};

describe("Download Results component", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
    })

    it("renders as expected", () => {
        const store = createStore();
        const wrapper = mountWithTranslate(DownloadResults, store,
            {
                global: {
                    plugins: [store],
                    stubs: ["upload-modal", "download-table-row"],
                },
                data() {
                    return { switches }
                }
            }
        );
        const downloadTableRows = wrapper.findAllComponents(DownloadTableRow);
        expect(downloadTableRows.length).toBe(5);
        Object.values(DownloadType).forEach((type, index) => {
            expect((downloadTableRows[index] as any).props("downloadType")).toBe(type);
        });
        const buttons = wrapper.findAll("button");
        expect(buttons.length).toBe(1);
    });

    it(`renders, opens and closes dialog as expected`, async () => {
        const store = createStore();
        const wrapper = mountWithTranslate(DownloadResults, store,
            {
                global: {
                    plugins: [store],
                    stubs: ["upload-modal"],
                },
                data() {
                    return {
                        uploadModalOpen: false
                    }
                }
            });

        expect(wrapper.findComponent(UploadModal).exists()).toBe(false)
        expect((wrapper.vm.$data as any).uploadModalOpen).toBe(false)

        const upload = wrapper.find("#upload").find("button")
        await upload.trigger("click")
        expect(wrapper.findComponent(UploadModal).exists()).toBe(true)
        expect((wrapper.vm.$data as any).uploadModalOpen).toBe(true)

        const modal = wrapper.findComponent(UploadModal)
        await modal.vm.$emit("close")
        expect(modal.emitted().close.length).toBe(1)
        expect((wrapper.vm.$data as any).uploadModalOpen).toBe(false)
    })

    it("invokes getUserCanUpload on mounted", async () => {
        const mockGetUserCanUpload = vi.fn();
        const store = createStore({userCanUpload: true}, mockGetUserCanUpload);
        shallowMount(DownloadResults, {
            global: {
                plugins: [store]
            }
        });
        expect(mockGetUserCanUpload.mock.calls.length).toBe(1);
    });

    it("does not display upload button when a user does not have permission", async () => {
        const store = createStore({userCanUpload: false});
        const wrapper = mount(DownloadResults,
            {
                global: {
                    plugins: [store],
                    stubs: ["upload-modal"],
                },
                data() {
                    return {
                        switches
                    }
                }
            });
        const headers = wrapper.findAll("h4");
        expect(headers.length).toBe(Object.values(DownloadType).length);
    });

    it("does not render status messages or error alerts without appropriate states", () => {
        const store = createStore({userCanUpload: true}, vi.fn());
        const wrapper = shallowMountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store]
            },
        });

        expect(wrapper.find("#uploading").exists()).toBe(false);
        expect(wrapper.find("#uploadComplete").exists()).toBe(false);
        expect(wrapper.find("error-alert-stub").exists()).toBe(false);
    });

    it("renders uploading status messages as expected and disables upload button", () => {
        const store = createStore({userCanUpload: true}, vi.fn(), {uploading: true});
        const wrapper = shallowMountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store]
            },
        });

        const statusMessage = wrapper.find("#uploading");
        expect(statusMessage.find("loading-spinner-stub").exists()).toBe(true)
        expectTranslated(statusMessage.find("span"), "Uploading 1 of 2 (this may take a while)",
            "Téléchargement de 1 sur 2 (cela peut prendre un certain temps)",
            "A carregar 1 de 2 (este processo poderá demorar um pouco)", store);

        const uploadButton = wrapper.find("#upload").find("button");
        expect((uploadButton.element as HTMLButtonElement).disabled).toBe(true)
    });

    it("renders upload complete and release created status messages as expected", () => {
        const store = createStore({userCanUpload: true}, vi.fn(), {uploadComplete: true, releaseCreated: true});
        const wrapper = shallowMountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store]
            },
        });

        const statusMessage = wrapper.find("#uploadComplete");
        expectTranslated(statusMessage.find("span"), "Upload complete",
            "Téléchargement complet", "Carregamento concluído", store);
        expect(statusMessage.find("tick-stub").exists()).toBe(true)

        const statusMessage2 = wrapper.find("#releaseCreated");
        expectTranslated(statusMessage2.find("span"), "Release created",
            "Version créée", "Lançamento criado", store);
        expect(statusMessage2.find("tick-stub").exists()).toBe(true)

        const uploadButton = wrapper.find("button");
        expect((uploadButton.element as HTMLButtonElement).disabled).toBe(false);
    });

    it("renders release not created status messages as expected", () => {
        const store = createStore({userCanUpload: true}, vi.fn(), {uploadComplete: true, releaseFailed: true});
        const wrapper = shallowMountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store]
            },
        });

        const statusMessage = wrapper.find("#releaseCreated");
        expectTranslated(statusMessage.find("span"), "Could not create new release",
            "Impossible de créer une nouvelle version", "Não foi possível criar um novo lançamento", store);
        expect(statusMessage.find("cross-stub").exists()).toBe(true)

        const uploadButton = wrapper.find("button");
        expect((uploadButton.element as HTMLButtonElement).disabled).toBe(false);
    });

    it("renders upload error alert as expected", () => {
        const error = {error: "ERR", detail: "there was an error"}
        const store = createStore({userCanUpload: true}, vi.fn(), {uploadError: error});
        const wrapper = shallowMountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store]
            },
        });

        const errorAlert = wrapper.findComponent(ErrorAlert);
        expect(errorAlert.props("error")).toEqual(error)

        const uploadButton = wrapper.find("button");
        expect((uploadButton.element as HTMLButtonElement).disabled).toBe(false);
        expect(uploadButton.classes()).toEqual(["btn", "btn-lg", "my-3", "btn-red"]);
    });

    it("disables upload button when upload in progress", () => {
        const store = createStore({userCanUpload: true}, vi.fn(), {uploading: true});
        const wrapper = shallowMountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store]
            }, 
        });

        const uploadButton = wrapper.find("button");
        expect((uploadButton.element as HTMLButtonElement).disabled).toBe(true);
        expect(uploadButton.classes()).toEqual(["btn", "btn-lg", "my-3", "btn-secondary"]);
    });

    it("calls prepareOutputs on mount", () => {
        const store = createStore();
        shallowMount(DownloadResults, {
            global: {
                plugins: [store]
            }
        });
        expect(mockPrepareAllOutputs.mock.calls.length).toBe(1);
    });

    it("calls clear status mutation before mount", () => {
        const spy = vi.fn()
        const store = createStore({}, vi.fn(), {}, {}, spy);
        shallowMount(DownloadResults, {
            global: {
                plugins: [store]
            }
        });
        expect(spy).toHaveBeenCalledTimes(1)
    });
});
