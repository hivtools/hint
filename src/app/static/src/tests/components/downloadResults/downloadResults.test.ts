import {createLocalVue, shallowMount, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockADRState, mockModelCalibrateState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
// import {ADRState} from "../../../app/store/adr/adr"

const localVue = createLocalVue();

// type UploadError: null {
//     detail: string,
//     error: string
// }

describe("Download Results component", () => {

    const createStore = (hasUploadPermission= true, getUserCanUpload = jest.fn(), uploading = false, uploadComplete = false, uploadError: any = null) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState({calibrateId: "testId"}),
                },
                adr: {
                    namespaced: true,
                    state: mockADRState({userCanUpload: hasUploadPermission, uploading, uploadComplete, uploadError}),
                    actions: {
                        getUserCanUpload,
                        getUploadFiles: jest.fn()
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

        const links = wrapper.findAll("a");
        expect(links.length).toBe(3);
        expectTranslated(links.at(0), "Export", "Exporter", store);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expectTranslated(links.at(1), "Download", "Télécharger", store);
        expect(links.at(1).attributes().href).toEqual("/download/coarse-output/testId");
        expectTranslated(links.at(2), "Download", "Télécharger", store);

        const buttons = wrapper.findAll("button");
        expect(buttons.length).toBe(1);
        expect(buttons.at(0).attributes().href).toEqual("#")
        expectTranslated(buttons.at(0), "Upload", "Télécharger", store);
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

    it("does not render upload status message when should not", async () => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store});
        expect(wrapper.find("#uploadStatus").exists()).toBe(false)
    });

    it("renders uploading status messages as expected and disables upload button", () => {
        const store = createStore(true, jest.fn(), true);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#uploadStatus");
        expect(statusMessage.find("loading-spinner-stub").exists()).toBe(true)
        expect(statusMessage.findAll("div").at(1).classes()).toContain("ml-1")
        expectTranslated(statusMessage.find("span"), "Uploading (this may take a while)",
            "Téléchargement (cela peut prendre un certain temps)", store);
        expect(statusMessage.find("tick-stub").exists()).toBe(false)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBe("disabled")
    });

    it("renders upload complete status messages as expected", () => {
        const store = createStore(true, jest.fn(), false, true);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#uploadStatus");
        expect(statusMessage.find("loading-spinner-stub").exists()).toBe(false)
        expect(statusMessage.findAll("div").at(1).classes()).toContain("mr-1")
        expect(statusMessage.find("span").classes()).toContain('font-weight-bold')
        expectTranslated(statusMessage.find("span"), "Upload complete",
            "Téléchargement complet", store);
        expect(statusMessage.find("tick-stub").exists()).toBe(true)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBeUndefined();
        // expect(uploadButton.attributes()).toBe({"class": "btn btn-red btn-lg my-3", "href": "#"})
    });

    it("renders upload error status messages as expected", () => {
        const error = { detail: "there was an error"}
        const store = createStore(true, jest.fn(), false, false, error);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#uploadStatus");
        expect(statusMessage.find("loading-spinner-stub").exists()).toBe(false)
        expect(statusMessage.find("span").classes()).toContain('text-danger')
        expect(statusMessage.find("span").text()).toBe("ERROR: " + error.detail)
        expect(statusMessage.find("tick-stub").exists()).toBe(false)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBeUndefined();
        // expect(uploadButton.attributes()).not.toContain("disabled")
    });
});
