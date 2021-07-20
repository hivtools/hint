import {createLocalVue, shallowMount, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockADRState, mockADRUploadState, mockDownloadResultsState, mockModelCalibrateState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import {DownloadResultsState} from "../../../app/store/downloadResults/downloadResults";
import DownloadProgress from "../../../app/components/downloadResults/DownloadProgress.vue";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const mockSpectrumDownloadAction = jest.fn();
    const mockSummaryDownloadAction = jest.fn();
    const mockCoarseOutputDownloadAction = jest.fn();

    const downloadResults = {
        summary: {downloading: true, complete: false, error: null} as any,
        spectrum: {downloading: true, complete: false, error: null} as any,
        coarseOutput: {downloading: true, complete: false, error: null} as any
    }


    const createStore = (hasUploadPermission= true, getUserCanUpload = jest.fn(), uploading = false, uploadComplete = false, uploadError: any = null, downloadResults? : Partial<DownloadResultsState>) => {
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
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders as expected", () => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store, localVue});

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

    it(`renders, opens and closes dialog as expected`, async() => {
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
        const wrapper = shallowMount(DownloadResults, {store});
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
        const error = { detail: "there was an error"}
        const store = createStore(true, jest.fn(), false, false, error);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const errorAlert = wrapper.find("error-alert-stub");
        expect(errorAlert.props("error")).toEqual(error)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBeUndefined();
    });

    it("can invoke spectrum download action", async() => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store});

        const button = wrapper.find("#spectrum-download").find("button")

        await button.trigger("click")
        expect(mockSpectrumDownloadAction.mock.calls.length).toBe(1)
        expect(mockSpectrumDownloadAction.mock.calls[0][1]).toBeUndefined()

        expect(mockSummaryDownloadAction.mock.calls.length).toBe(0)
        expect(mockCoarseOutputDownloadAction.mock.calls.length).toBe(0)
    });

    it("can invoke summary download action", async() => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store});

        const button = wrapper.find("#summary-download").find("button")

        await button.trigger("click")
        expect(mockSummaryDownloadAction.mock.calls.length).toBe(1)
        expect(mockSummaryDownloadAction.mock.calls[0][1]).toBeUndefined()
    });

    it("can invoke coarseOutput download action", async() => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store});

        const button = wrapper.find("#coarse-output-download").find("button")

        await button.trigger("click")
        expect(mockCoarseOutputDownloadAction.mock.calls.length).toBe(1)
        expect(mockCoarseOutputDownloadAction.mock.calls[0][1]).toBeUndefined()
    });
});
