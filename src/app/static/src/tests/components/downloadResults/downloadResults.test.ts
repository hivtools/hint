import {mount, shallowMount, VueWrapper} from '@vue/test-utils';
import Vuex, {Store} from 'vuex';
import {
    mockADRState,
    mockADRUploadState,
    mockDownloadResultsDependency,
    mockDownloadResultsState,
    mockModelCalibrateState,
} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState, RootState} from "../../../app/root";
import {expectTranslated, mountWithTranslate, shallowMountWithTranslate} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import {DownloadResultsState} from "../../../app/store/downloadResults/downloadResults";
import Download from "../../../app/components/downloadResults/Download.vue";
import {ADRState} from "../../../app/store/adr/adr";
import {ADRUploadState} from "../../../app/store/adrUpload/adrUpload";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import { DownloadType } from '../../../app/store/downloadResults/downloadConfig';

const mockPrepareAllOutputs = vi.fn();

const switches: Record<DownloadType, boolean> = {
    Summary: true,
    Comparison: true,
    Spectrum: true,
    CoarseOutput: true
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

// Mock the download element creation
const mockClick = vi.fn();
const mockRemove = vi.fn();
const mockLink = {click: mockClick, remove: mockRemove};

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
                    stubs: ["upload-modal"],
                },
                data() {
                    return {
                        comparisonSwitch: true
                    }
                }
            });

        const headers = wrapper.findAll("h4");
        expectTranslated(headers[0], "Download Naomi results",
            "Télécharger les résultats de Naomi", "Baixe os resultados de Naomi", store);
        expectTranslated(headers[1], "Download coarse age group outputs",
            "Télécharger les résultats grossiers du groupe d'âge",
            "Descarregar resultados de grupos etários grosseiros", store);
        expectTranslated(headers[2], "Download summary report",
            "Télécharger le rapport de synthèse", "Descarregar relatório de síntese", store);
        expectTranslated(headers[3], "Download comparison report",
            "Télécharger le rapport de comparaison", "Baixar relatório de comparação", store);
        expectTranslated(headers[4], "Upload to ADR",
            "Télécharger vers ADR", "Carregar para o ADR", store);

        const buttons = wrapper.findAll("button");
        expect(buttons.length).toBe(5);
        expectTranslated(buttons[0], "Download", "Télécharger", "Descarregar", store);
        expectTranslated(buttons[1], "Download", "Télécharger", "Descarregar", store);
        expectTranslated(buttons[2], "Download", "Télécharger", "Descarregar", store);
        expectTranslated(buttons[3], "Download", "Télécharger", "Descarregar", store);
        expectTranslated(buttons[4], "Upload", "Télécharger", "Carregar", store);
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

    it("disables download buttons when upload in progress", () => {
        const store = createStore({userCanUpload: true}, vi.fn(), {uploading: true});
        const wrapper = shallowMount(DownloadResults, {
            global: {
                plugins: [store]
            },
            data() {
                return {
                    switches
                }
            }
        });

        const downloadButtons = wrapper.findAllComponents(Download);
        expect(downloadButtons.length).toBe(Object.values(DownloadType).length)
        expect(downloadButtons[0].props("disabled")).toBe(true)
        expect(downloadButtons[1].props("disabled")).toBe(true)
        expect(downloadButtons[2].props("disabled")).toBe(true)
        expect(downloadButtons[3].props("disabled")).toBe(true)
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

describe("Single DownloadType button", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    })

    Object.values(DownloadType).forEach(type => testDownloadButton(type));
});

const testDownloadButton = (type: DownloadType) => {
    const mountWithSwitchesOn = (downloadResultsDep = {}) => {
        const store = createStore({}, vi.fn(), {}, {
            [type]: mockDownloadResultsDependency(downloadResultsDep)
        });

        return mountWithTranslate(DownloadResults, store, {
            global: {
                plugins: [store],
                stubs: ["upload-modal"]
            },
            data: () => ({ switches })
        });
    };

    const getButton = (wrapper: VueWrapper) => wrapper.find(`#${type}-download`).find("button");

    it("cannot download output while preparing", () => {
        const wrapper = mountWithSwitchesOn({
            preparing: true,
            downloadId: "1"
        });
        const button = getButton(wrapper);
        expect(button.attributes().disabled).toBe("");
    });

    it("cannot download output if downloadId does not exist", async () => {
        const wrapper = mountWithSwitchesOn();
        const button = getButton(wrapper);
        expect(button.attributes().disabled).toBe("");
    });

    it("can download file once prepared", async () => {
        const wrapper = mountWithSwitchesOn({
            preparing: false,
            complete: true,
            error: null,
            downloadId: "123"
        });

        vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);

        const button = getButton(wrapper);
        await button.trigger("click")
        expect(document.createElement).toHaveBeenCalledTimes(1);
        expect(document.createElement).toHaveBeenCalledWith("a");
        expect(mockClick).toHaveBeenCalledTimes(1);
        expect((mockLink as any).href).toBe("/download/result/123");
        expect((mockLink as any).download).toBe("downloaded_file");
    });

    it("can display error message for download file when errored", async () => {
        const error = { error: "oops...", detail: "i did it again" };
        const wrapper = mountWithSwitchesOn({
            preparing: false,
            complete: true,
            error,
            downloadId: "123"
        });
        const button = getButton(wrapper);
        expect(button.attributes().disabled).toBeUndefined();
        expect(wrapper.findComponent(ErrorAlert).props("error")).toEqual(error);
    });
};
