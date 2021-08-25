import {createLocalVue, shallowMount, mount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockADRState, mockADRUploadState, mockModelCalibrateState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const createStore = (hasUploadPermission= true, getUserCanUpload = jest.fn(), uploading = false, uploadComplete = false, uploadError: any = null, releaseCreated = false, releaseFailed = false) => {
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
                        releaseCreated,
                        releaseFailed,
                        currentFileUploading: 1,
                        totalFilesUploading: 2
                    }),
                    actions: {
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
            "Exporter des sorties de modèles pour Spectrum", "Exportação de saídas modelo para Spectrum", store);
        expectTranslated(headers.at(1), "Download coarse age group outputs",
            "Télécharger les résultats grossiers du groupe d'âge",
            "Descarregar resultados de grupos etários grosseiros", store);
        expectTranslated(headers.at(2), "Download summary report",
            "Télécharger le rapport de synthèse", "Descarregar relatório de síntese", store);
        expectTranslated(headers.at(3), "Upload to ADR",
            "Télécharger vers ADR", "Carregar para o ADR", store);

        const links = wrapper.findAll("a");
        expect(links.length).toBe(3);
        expectTranslated(links.at(0), "Export", "Exporter", "Exportação", store);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expectTranslated(links.at(1), "Download", "Télécharger", "Descarregar", store);
        expect(links.at(1).attributes().href).toEqual("/download/coarse-output/testId");
        expectTranslated(links.at(2), "Download", "Télécharger", "Descarregar", store);

        const buttons = wrapper.findAll("button");
        expect(buttons.length).toBe(1);
        expect(buttons.at(0).attributes().href).toEqual("#")
        expectTranslated(buttons.at(0), "Upload", "Télécharger", "Carregar", store);
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
            "Téléchargement de 1 sur 2 (cela peut prendre un certain temps)",
            "A carregar 1 de 2 (este processo poderá demorar um pouco)", store);

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBe("disabled")
    });

    it("renders upload complete and release created status messages as expected", () => {
        const store = createStore(true, jest.fn(), false, true, null, true);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#uploadComplete");
        expectTranslated(statusMessage.find("span"), "Upload complete",
            "Téléchargement complet", "Carregamento concluído", store);
        expect(statusMessage.find("tick-stub").exists()).toBe(true)

        const statusMessage2 = wrapper.find("#releaseCreated");
        expectTranslated(statusMessage2.find("span"), "Release created",
            "Version créée", "Lançamento criado", store);
        expect(statusMessage2.find("tick-stub").exists()).toBe(true)

        const uploadButton = wrapper.find("button");
        expect(uploadButton.attributes("disabled")).toBeUndefined();
    });

    it("renders release not created status messages as expected", () => {
        const store = createStore(true, jest.fn(), false, true, null, false, true);
        const wrapper = shallowMount(DownloadResults, {store, localVue});

        const statusMessage = wrapper.find("#releaseCreated");
        expectTranslated(statusMessage.find("span"), "Could not create new release",
            "Impossible de créer une nouvelle version", "Não foi possível criar um novo lançamento", store);
        expect(statusMessage.find("#cross").exists()).toBe(true)

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
});
