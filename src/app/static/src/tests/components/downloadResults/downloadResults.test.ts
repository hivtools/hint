import {createLocalVue, shallowMount, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockADRState, mockError, mockModelCalibrateState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import {BaselineState} from "../../../app/store/baseline/baseline";
import {ADRState} from "../../../app/store/adr/adr";
import {BAlert} from "bootstrap-vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const mockPartialADRState = {
        userCanUpload: true,
        uploadSucceeded: false,
        uploadStatus: "",
        uploadError: mockError("")
    }
    const createStore = (mockADRState = mockPartialADRState, getUserCanUpload = jest.fn()) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                modelCalibrate: {
                    namespaced: true,
                    state: mockModelCalibrateState({calibrateId: "testId"}),
                },
                adr: {
                    namespaced: true,
                    state: mockADRState,
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
        expect(links.length).toBe(4);
        expectTranslated(links.at(0), "Export", "Exporter", store);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expectTranslated(links.at(1), "Download", "Télécharger", store);
        expect(links.at(1).attributes().href).toEqual("/download/coarse-output/testId");
        expectTranslated(links.at(2), "Download", "Télécharger", store);
        expect(links.at(2).attributes().href).toEqual("/download/summary/testId")
        expectTranslated(links.at(3), "Upload", "Télécharger", store);
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

        const upload = wrapper.find("#upload").find("a")
        await upload.trigger("click")
        expect(wrapper.vm.$data.uploadModalOpen).toBe(true)

        const modal = wrapper.find(UploadModal)
        await modal.vm.$emit("close")
        expect(modal.emitted().close.length).toBe(1)
        expect(wrapper.vm.$data.uploadModalOpen).toBe(false)
    })

    it("invokes getUserCanUpload on mounted", async () => {
        const mockGetUserCanUpload = jest.fn();
        const mockPartialADRState = {
            userCanUpload: true,
            uploadSucceeded: false,
            uploadStatus: "",
            uploadError: mockError("")
        }
        const store = createStore(mockPartialADRState, mockGetUserCanUpload);
        shallowMount(DownloadResults, {store});
        expect(mockGetUserCanUpload.mock.calls.length).toBe(1);
    });

    it("does not display upload button when a user does not have permission", async () => {
        const mockPartialADRState = {
            userCanUpload: false,
            uploadSucceeded: false,
            uploadStatus: "",
            uploadError: mockError("")
        }
        const store = createStore(mockPartialADRState);
        const wrapper = shallowMount(DownloadResults, {store});
        const headers = wrapper.findAll("h4");
        expect(headers.length).toBe(3)
    });

    it("does display success message when files are uploaded successfully", async () => {
        const mockPartialADRState = {
            userCanUpload: true,
            uploadSucceeded: true,
            uploadStatus: "Upload completed successfully",
            uploadError: mockError("")
        }
        const store = createStore(mockPartialADRState);
        const wrapper = shallowMount(DownloadResults, {store});
        const Alert = wrapper.find(BAlert);
        expect(Alert.props("variant")).toBe("success")
        expect(Alert.text()).toBe("Upload completed successfully")
    });

    it("does display an error message when upload files failed", async () => {
        const error = mockError("Failed to upload files")
        const mockPartialADRState = {
            userCanUpload: true,
            uploadSucceeded: false,
            uploadStatus: "",
            uploadError: error
        }
        const store = createStore(mockPartialADRState);
        const wrapper = shallowMount(DownloadResults, {store});
        const errorAlert = wrapper.find(ErrorAlert);
        expect(errorAlert.props().error).toBe(error)
    });

    it("does not display an error message when upload is successful", async () => {
        const mockPartialADRState = {
            userCanUpload: true,
            uploadSucceeded: true,
            uploadStatus: "",
            uploadError: mockError("")
        }
        const store = createStore(mockPartialADRState);
        const wrapper = shallowMount(DownloadResults, {store});
        const errorAlert = wrapper.find(ErrorAlert);
        expect(errorAlert.props("error").exists).toBeFalsy()
    });

    it("renders alert correctly when upload succeeded and upload modal closes", async () => {
        const mockPartialADRState = {
            userCanUpload: true,
            uploadSucceeded: true,
            uploadStatus: "Upload completed successfully",
            uploadError: mockError("")
        }
        const store = createStore(mockPartialADRState);
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
        expect(wrapper.vm.$data.showAlert).toBe(false)

        const upload = wrapper.find("#upload").find("a")
        await upload.trigger("click")
        expect(wrapper.vm.$data.uploadModalOpen).toBe(true)
        expect(wrapper.vm.$data.showAlert).toBe(false)

        const modal = wrapper.find(UploadModal)
        await modal.vm.$emit("close")
        expect(modal.emitted().close.length).toBe(1)
        expect(wrapper.vm.$data.uploadModalOpen).toBe(false)
        expect(wrapper.vm.$data.showAlert).toBe(true)
    });

    it("dismissed alert correctly when dismiss button is clicked", async () => {
        const mockPartialADRState = {
            userCanUpload: true,
            uploadSucceeded: true,
            uploadStatus: "Upload completed successfully",
            uploadError: mockError("")
        }
        const store = createStore(mockPartialADRState);
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

        const upload = wrapper.find("#upload").find("a")
        await upload.trigger("click")
        expect(wrapper.vm.$data.uploadModalOpen).toBe(true)
        expect(wrapper.vm.$data.showAlert).toBe(false)

        const modal = wrapper.find(UploadModal)
        await modal.vm.$emit("close")
        expect(modal.emitted().close.length).toBe(1)
        expect(wrapper.vm.$data.uploadModalOpen).toBe(false)
        expect(wrapper.vm.$data.showAlert).toBe(true)

        const Alert = wrapper.find(BAlert)
        await Alert.vm.$emit("dismissed")
        expect(wrapper.vm.$data.showAlert).toBe(false)
    });
});
