import {createLocalVue, shallowMount, mount} from '@vue/test-utils';
import Vuex, {Store} from 'vuex';
import {
    mockADRState,
    mockADRUploadState,
    mockDownloadResultsState, mockError, mockMetadataState,
    mockModelCalibrateState
} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import {DownloadResultsState} from "../../../app/store/downloadResults/downloadResults";
import DownloadProgress from "../../../app/components/downloadResults/DownloadProgress.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import Download from "../../../app/components/downloadResults/Download.vue";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const mockSpectrumDownloadAction = jest.fn();
    const mockSummaryDownloadAction = jest.fn();
    const mockCoarseOutputDownloadAction = jest.fn();
    const mockUploadMetadataAction = jest.fn();

    const mockDownloading = {
        downloading: true,
        complete: false,
        error: null,
        downloadId: null
    }

    afterEach(() => {
        jest.useRealTimers()
    })

    const createStore = (hasUploadPermission = true, getUserCanUpload = jest.fn(), uploading = false, uploadComplete = false, uploadError: any = null, downloadResults?: Partial<DownloadResultsState>) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState({calibrateId: "testId"}),
                },
                adr: {
                    namespaced: true,
                    state: mockADRState({userCanUpload: hasUploadPermission}),
                    actions: {
                        getUserCanUpload
                    }
                },
                adrUpload: {
                    namespaced: true,
                    state: mockADRUploadState({
                        uploading,
                        uploadComplete,
                        uploadError,
                        currentFileUploading: 1,
                        totalFilesUploading: 2
                    }),
                    actions: {
                        getUploadFiles: jest.fn()
                    }
                },
                downloadResults: {
                    namespaced: true,
                    state: mockDownloadResultsState(downloadResults),
                    actions: {
                        downloadSpectrum: mockSpectrumDownloadAction,
                        downloadSummary: mockSummaryDownloadAction,
                        downloadCoarseOutput: mockCoarseOutputDownloadAction
                    }
                },
                metadata: {
                    namespaced: true,
                    state: mockMetadataState(),
                    actions: {
                        getAdrUploadMetadata: mockUploadMetadataAction
                    }
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders as expected", () => {
        const store = createStore();
        const wrapper = mount(DownloadResults, {store, localVue, stubs: ["upload-modal"]});

        const headers = wrapper.findAll("h4");
        expectTranslated(headers.at(0), "Export model outputs for Spectrum",
            "Exporter des sorties de modèles pour Spectrum", store);
        expectTranslated(headers.at(1), "Download coarse age group outputs",
            "Télécharger les résultats grossiers du groupe d'âge", store);
        expectTranslated(headers.at(2), "Download summary report",
            "Télécharger le rapport de synthèse", store);
        expectTranslated(headers.at(3), "Upload to ADR",
            "Télécharger vers ADR", store);

        const buttons = wrapper.findAll("button");
        expect(buttons.length).toBe(4);
        expectTranslated(buttons.at(0), "Export", "Exporter", store);
        expectTranslated(buttons.at(1), "Download", "Télécharger", store);
        expectTranslated(buttons.at(2), "Download", "Télécharger", store);
        expectTranslated(buttons.at(3), "Upload", "Télécharger", store);
    });

    it(`renders, opens and closes dialog as expected`, async () => {
        const store = createStore();
        const wrapper = mount(DownloadResults,
            {
                store,
                localVue,
                stubs: ["upload-modal"],
                data() {
                    return {
                        uploadModalOpen: false
                    }
                }
            });

        expect(wrapper.find(UploadModal).exists()).toBe(true)
        expect(wrapper.vm.$data.uploadModalOpen).toBe(false)

        const upload = wrapper.find("#upload").find("button")
        await upload.trigger("click")
        expect(wrapper.vm.$data.uploadModalOpen).toBe(true)

        const modal = wrapper.find(UploadModal)
        await modal.vm.$emit("close")
        expect(modal.emitted().close.length).toBe(1)
        expect(wrapper.vm.$data.uploadModalOpen).toBe(false)
    })

    it("invokes getUserCanUpload on mounted", async () => {
        const mockGetUserCanUpload = jest.fn();
        const store = createStore(true, mockGetUserCanUpload);
        shallowMount(DownloadResults, {store});
        expect(mockGetUserCanUpload.mock.calls.length).toBe(1);
    });

    it("does not display upload button when a user does not have permission", async () => {
        const store = createStore(false);
        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});
        const headers = wrapper.findAll("h4");
        expect(headers.length).toBe(3)
    });

    it("does not render status messages or error alerts without appropriate states", () => {
        const store = createStore(true, jest.fn());
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        expect(wrapper.find("#uploading").exists()).toBe(false);
        expect(wrapper.find("#uploadComplete").exists()).toBe(false);
        expect(wrapper.find("error-alert-stub").exists()).toBe(false);
    });

    it("renders uploading status messages as expected and disables upload button", () => {
        const store = createStore(true, jest.fn(), true);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#uploading");
        expect(statusMessage.find("loading-spinner-stub").exists()).toBe(true)
        expectTranslated(statusMessage.find("span"), "Uploading 1 of 2 (this may take a while)",
            "Téléchargement de 1 sur 2 (cela peut prendre un certain temps)", store);

        const uploadButton = wrapper.find("#upload").find("button");
        expect(uploadButton.attributes("disabled")).toBe("disabled")
    });

    it("renders upload complete status messages as expected", () => {
        const store = createStore(true, jest.fn(), false, true);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#uploadComplete");
        expectTranslated(statusMessage.find("span"), "Upload complete",
            "Téléchargement complet", store);
        expect(statusMessage.find("tick-stub").exists()).toBe(true)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBeUndefined();
    });

    it("renders upload error alert as expected", () => {
        const error = {detail: "there was an error"}
        const store = createStore(true, jest.fn(), false, false, error);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const errorAlert = wrapper.find("error-alert-stub");
        expect(errorAlert.props("error")).toEqual(error)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBeUndefined();
    });

    it("can download spectrum file when download is complete", () => {
        const store = createStore();
        const downloadResults = {
            summary: {
                downloading: true,
                complete: false,
                error: null,
                downloadId: null
            },
            coarseOutput: {
                downloading: true,
                complete: false,
                error: null,
                downloadId: null
            },
            spectrum: {
                downloading: false,
                complete: true,
                error: null,
                downloadId: "123"
            }
        }
        downloadFile(store, downloadResults)
    });

    it("does not call spectrum action when download is already in progress and can add props data to download progress", () => {
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {spectrum: mockDownloading} as any);

        doesNotCallAction(store, mockSpectrumDownloadAction, "#spectrum-download")
    });

    it("can invoke spectrum download action", async () => {
        const store = createStore();
        const wrapper = mount(DownloadResults, {
            store,
            stubs: ["upload-modal"]
        });

        const button = wrapper.find("#spectrum-download").find("button")

        await button.trigger("click")
        expect(mockSpectrumDownloadAction.mock.calls.length).toBe(1)
        expect(mockSpectrumDownloadAction.mock.calls[0][1]).toBeUndefined()

        expect(mockSummaryDownloadAction.mock.calls.length).toBe(0)
        expect(mockCoarseOutputDownloadAction.mock.calls.length).toBe(0)
    });

    it("can render error when spectrum download action is unsuccessful", () => {
        const testError = {
            downloading: false,
            complete: false,
            error: mockError("TEST FAILED"),
            downloadId: null
        }
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {spectrum: testError} as any);

        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});

        const button = wrapper.find("#spectrum-download").find("button")

        button.trigger("click")

        expect(wrapper.find("#error").text()).toBe( "TEST FAILED")
    });

    it("can stop polling spectrum download when error response", () => {
        const spectrumDownloadStatus = {
            downloading: true,
            complete: false,
            error: null,
            downloadId: 1,
            statusPollId: 123
        }

        const spectrumTestError = {
            summary: {
                downloading: false,
                complete: false,
                error: null,
                downloadId: null
            },
            coarseOutput: {
                downloading: false,
                complete: false,
                error: null,
                downloadId: null
            },
            spectrum: {
                downloading: false,
                complete: false,
                error: mockError("TEST FAILED"),
                downloadId: null,
                statusPollId: 123
            }
        }

        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {spectrum: spectrumDownloadStatus} as any);

        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});

        jest.useFakeTimers()
        const button = wrapper.find("#spectrum-download").find("button")
        button.trigger("click")

        wrapper.vm.$store.state.downloadResults = spectrumTestError
        expect(clearInterval).toHaveBeenCalledTimes(1)
        expect(wrapper.find("#error").text()).toBe("TEST FAILED")
    });

    it("can fetch upload metadata when spectrum download action is complete", () => {
        const testComplete = {
            downloading: false,
            complete: true,
            error: null,
            downloadId: "123"
        }
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {spectrum: testComplete} as any);

        const wrapper = mount(DownloadResults, {
            store,
            localVue,
            stubs: ["upload-modal"]
        });

        expect(mockUploadMetadataAction.mock.calls[0][1]).toBe("123")
        expect(wrapper.find(DownloadProgress).find(LoadingSpinner).exists()).toBe(false)
    });

    it("does not call summary action when download is already in progress and can add props data to download progress", () => {
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {summary: mockDownloading} as any);

        doesNotCallAction(store, mockSummaryDownloadAction, "#summary-download")
    });

    it("can invoke summary download action", async () => {
        const store = createStore();
        const wrapper = mount(DownloadResults, {store, stubs:["upload-modal"]});

        const button = wrapper.find("#summary-download").find("button")

        await button.trigger("click")
        expect(mockSummaryDownloadAction.mock.calls.length).toBe(1)
        expect(mockSummaryDownloadAction.mock.calls[0][1]).toBeUndefined()
    });

    it("can download coarseOutput file when download is complete", () => {
        const store = createStore();
        const downloadResults = {
            summary: {
                downloading: false,
                complete: true,
                error: null,
                downloadId: "123"
            },
            coarseOutput: {
                downloading: true,
                complete: false,
                error: null,
                downloadId: null
            },
            spectrum: {
                downloading: true,
                complete: false,
                error: null,
                downloadId: null
            }
        }
        downloadFile(store, downloadResults)
    });

    it("can render error when summary download action is unsuccessful", () => {
        const testError = {
            downloading: false,
            complete: false,
            error: mockError("TEST FAILED"),
            downloadId: null
        }
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {summary: testError} as any);

        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});

        const button = wrapper.find("#summary-download").find("button")

        button.trigger("click")

        expect(wrapper.find("#error").text()).toBe( "TEST FAILED")
    });

    it("can fetch upload metadata when summary download action is complete", () => {
        const testComplete = {
            downloading: false,
            complete: true,
            error: null,
            downloadId: "123"
        }
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {summary: testComplete} as any);

        const wrapper = mount(DownloadResults, {
            store,
            localVue,
            stubs: ["upload-modal"]
        });

        expect(mockUploadMetadataAction.mock.calls[0][1]).toBe("123")
        expect(wrapper.find(DownloadProgress).find(LoadingSpinner).exists()).toBe(false)
    });

    it("can stop polling summary download when error response", () => {
        const summaryDownloadStatus = {
            downloading: true,
            complete: false,
            error: null,
            downloadId: 1,
            statusPollId: 123
        }

        const summaryTestError = {
            summary: {
                downloading: false,
                complete: false,
                error: mockError("TEST FAILED"),
                downloadId: null,
                statusPollId: 123
            },
            coarseOutput: {
                downloading: false,
                complete: false,
                error: null,
                downloadId: null
            },
            spectrum: {
                downloading: false,
                complete: false,
                error: null,
                downloadId: null
            }
        }

        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {summary: summaryDownloadStatus} as any);

        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});

        jest.useFakeTimers()
        const button = wrapper.find("#summary-download").find("button")
        button.trigger("click")

        wrapper.vm.$store.state.downloadResults = summaryTestError
        expect(clearInterval).toHaveBeenCalledTimes(1)
        expect(wrapper.find("#error").text()).toBe("TEST FAILED")
    });

    it("can download coarseOutput file when download is complete", () => {
        const store = createStore();
        const downloadResults = {
            summary: {
                downloading: true,
                complete: false,
                error: null,
                downloadId: null
            },
            coarseOutput: {
                downloading: false,
                complete: true,
                error: null,
                downloadId: "123"
            },
            spectrum: {
                downloading: true,
                complete: false,
                error: null,
                downloadId: null
            }
        }
        downloadFile(store, downloadResults)
    });

    it("does not call coarse output action when download is in progress and can add props data to download progress", () => {
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {coarseOutput: mockDownloading} as any);

        doesNotCallAction(store, mockCoarseOutputDownloadAction, "#coarse-output-download")
    });

    it("can invoke coarseOutput download action", async () => {
        const store = createStore();
        const wrapper = mount(DownloadResults, {
            store,
            stubs: ["upload-modal"]
        });

        const button = wrapper.find("#coarse-output-download").find("button")

        await button.trigger("click")
        expect(mockCoarseOutputDownloadAction.mock.calls.length).toBe(1)
        expect(mockCoarseOutputDownloadAction.mock.calls[0][1]).toBeUndefined()
    });

    it("can render error when coarseOutput download action is unsuccessful", () => {
        const testError = {
            downloading: false,
            complete: false,
            error: mockError("TEST FAILED"),
            downloadId: null
        }
        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {coarseOutput: testError} as any);

        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});
        const button = wrapper.find("#coarse-output-download").find("button")

        button.trigger("click")
        expect(wrapper.find("#error").text()).toBe("TEST FAILED")
    });

    it("can stop polling coarseOutput download when error response", () => {
        const coarseDownloadStatus = {
            downloading: true,
            complete: false,
            error: null,
            downloadId: 1,
            statusPollId: 123
        }

        const coarseTestError = {
            summary: {
                downloading: false,
                complete: false,
                error: null,
                downloadId: null
            },
            coarseOutput: {
                downloading: false,
                complete: false,
                error: mockError("TEST FAILED"),
                downloadId: null,
                statusPollId: 123
            },
            spectrum: {
                downloading: false,
                complete: false,
                error: null,
                downloadId: null
            }
        }

        const store = createStore(
            false,
            jest.fn(),
            false,
            false,
            null,
            {coarseOutput: coarseDownloadStatus} as any);

        const wrapper = mount(DownloadResults, {store, stubs: ["upload-modal"]});

        jest.useFakeTimers()
        const button = wrapper.find("#coarse-output-download").find("button")
        button.trigger("click")

        wrapper.vm.$store.state.downloadResults = coarseTestError
        expect(clearInterval).toHaveBeenCalledTimes(1)
        expect(wrapper.find("#error").text()).toBe("TEST FAILED")
    });

});

const doesNotCallAction = (store: Store<any>, mockAction = jest.fn(), id: string) => {
    const wrapper = mount(DownloadResults, {
        store,
        localVue,
        stubs: ["upload-modal"],
        data() {
            return {
                uploadModalOpen: false
            }
        }
    });

    const download = wrapper.find(id)
    const button = download.find("button")
    button.trigger("click")

    expect(mockAction.mock.calls.length).toBe(0)
    expect(download.find(Download).exists()).toBe(true)
    expect(download.find(DownloadProgress).props())
        .toEqual({translateKey: "downloading", downloading: true})

    const downloading = download.find(DownloadProgress).find("#downloading")
    expect(downloading.find(LoadingSpinner).exists()).toBe(true)
    expectTranslated(downloading, "Downloading...", "Téléchargement...", store)
}

const downloadFile = (store: Store<any>, downloadResultsData: {}) => {
    mount(DownloadResults, {store, stubs: ["upload-modal"]});
    jest.useFakeTimers()

    const realLocation = window.location
    delete window.location;
    window.location = {...window.location, assign: jest.fn()};

    expect(window.location.assign).not.toHaveBeenCalled()
    store.state.downloadResults = downloadResultsData

    expect(clearInterval).toHaveBeenCalledTimes(1)
    expect(window.location.assign).toHaveBeenCalledTimes(1)
    expect(window.location.assign).toHaveBeenCalledWith("/download/result/123")
    window.location = realLocation
}