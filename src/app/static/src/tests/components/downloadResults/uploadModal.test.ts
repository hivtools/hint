import {mount, shallowMount} from "@vue/test-utils";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {
    mockADRState,
    mockADRUploadState,
    mockBaselineState,
    mockDatasetResource,
    mockDownloadResultsState, mockError, mockMetadataState
} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";
import Vue from 'vue';
import {Dict} from "../../../app/types";
import DownloadProgress from "../../../app/components/downloadResults/DownloadProgress.vue"
import {DownloadResultsState} from "../../../app/store/downloadResults/downloadResults";

describe(`uploadModal `, () => {

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.resetAllMocks()
        jest.useRealTimers()
    });

    const fakeMetadata = {
        outputZip:
            {
                index: 1,
                displayName: "uploadFileOutputZip",
                resourceType: "outputZip",
                resourceFilename: "naomi-model-outputs-project1.zip",
                resourceId: null,
                resourceUrl: null,
                lastModified: null,
                resourceName: "Naomi Output Zip"
            },
        outputSummary:
            {
                index: 2,
                displayName: "uploadFileOutputSummary",
                resourceType: "outputSummary",
                resourceFilename: "string",
                resourceId: "value",
                resourceUrl: null,
                lastModified: "2021-01-25T06:34:12.375649",
                resourceName: "Naomi Output Zip"
            }
    }

    const metadataWithInput = {
        ...fakeMetadata,
        population: {
            index: 3,
            displayName: "population",
            resourceType: "inputs-unaids-population",
            resourceFilename: "naomi-model-outputs-population.zip",
            resourceId: 123,
            resourceUrl: null,
            lastModified: "2021-06-01",
            resourceName: "TestPopulation"
        }
    };

    const mockResources = {
        pjnz: mockDatasetResource(),
        pop: mockDatasetResource(),
        program: mockDatasetResource(),
        anc: null,
        shape: null,
        survey: null,
    }
    const mockOrganization = {
        id: "123abc"
    }

    const mockDownloadResults = {
        summary: {complete: false, downloading: false } as any,
        spectrum: {complete: false, downloading: false} as any
    } as any

    const failedDownloadResults = {
        summary: {
            downloading: false,
            complete: false,
            error: null,
            downloadId: 321,
            statusPollId: 123
        },
        spectrum: {
            downloading: false,
            complete: false,
            error: mockError("TEST FAILED"),
            downloadId: null,
            statusPollId: 123
        }
    }

    const mockSpectrumDownload = jest.fn();
    const mockSummaryDownload = jest.fn();
    const mockUploadFilesToADR = jest.fn();
    const mockUploadMetadataAction = jest.fn();

    const createStore = (data: Dict<any> = fakeMetadata, downloadResults : Partial<DownloadResultsState> = mockDownloadResults) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(
                        {
                            selectedDataset:
                                {
                                    id: "1",
                                    url: "example.com",
                                    title: "test title",
                                    resources: mockResources,
                                    organization: mockOrganization
                                }
                        })
                },
                adrUpload: {
                    namespaced: true,
                    state: mockADRUploadState({uploadFiles: data}),
                    actions: {
                        uploadFilesToADR: mockUploadFilesToADR
                    },
                    mutations: {
                        ADRUploadStarted: jest.fn()
                    }
                },
                adr: {
                    namespaced: true,
                    state: mockADRState({
                        schemas: {
                            outputSummary: "outputSummary",
                            outputZip: "outputZip"
                        } as any
                    })
                },
                downloadResults: {
                    namespaced: true,
                    state: mockDownloadResultsState(downloadResults),
                    actions: {
                        downloadSpectrum: mockSpectrumDownload,
                        downloadSummary: mockSummaryDownload
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

    const getWrapper = () => {
        return shallowMount(UploadModal,
            {
                store: createStore()
            })
    }

    it(`renders modal as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const dialog = wrapper.find("#dialog")
        expect(dialog.exists()).toBe(true)
        const text = dialog.find("h4")
        expectTranslated(text, "Upload to ADR", "Télécharger vers ADR", "Carregar para o ADR", store)
    })

    it(`renders dataset name as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const dataset = wrapper.find("#dialog").find("#dataset-id")
        expectTranslated(dataset, "Dataset: test title",
            "Base de données: test title", "Conjunto de dados: test title", store)
    })

    it(`renders instructions text as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const instructions = wrapper.find("#instructions")
        expectTranslated(instructions,
            "Please select the new or modified files which should be uploaded",
            "Veuillez sélectionner les fichiers nouveaux ou modifiés qui doivent être téléchargés",
            "Por favor, selecione os ficheiros novos ou modificados que devem ser carregados",
            store)
    })

    it(`renders Output files, inputs, overwritten text and labels as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const overwriteText = wrapper.findAll("small")
        expect(overwriteText.length).toBe(1)
        expectTranslated(overwriteText.at(0), "This file already exists on ADR " +
            "and will be overwritten. File was updated 25/01/2021 06:34:12",
            "Ce fichier existe déjà sur ADR et sera écrasé. Le fichier a été mis à jour 25/01/2021 06:34:12",
            "Este ficheiro já existe no ADR e será substituído. O ficheiro foi atualizado 25/01/2021 06:34:12", store);

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        expect(inputs.at(0).attributes("id")).toBe("id-0-0");
        expect(inputs.at(1).attributes("id")).toBe("id-0-1");

        const label = wrapper.findAll("label.form-check-label")
        expect(label.length).toBe(2)
        expect(label.at(0).attributes("for")).toBe("id-0-0");
        expect(label.at(1).attributes("for")).toBe("id-0-1");

        expectTranslated(label.at(0), "Model outputs", "Résultats du modèle", "Saídas modelo", store)
        expectTranslated(label.at(1), "Summary report", "Rapport sommaire", "Relatório de síntese", store)
    })

    it(`checkboxes are set by default`, async () => {
        const store = createStore({})
        const wrapper = shallowMount(UploadModal, {store})
        store.state.adrUpload.uploadFiles = fakeMetadata
        await Vue.nextTick()
        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)

        const input1 =  inputs.at(0).element as HTMLInputElement
        expect(input1.checked).toBe(true)

        const input2 =  inputs.at(1).element as HTMLInputElement
        expect(input2.checked).toBe(true)
    })

    it(`can check and get values from check boxes`, async () => {
        const wrapper = getWrapper()
        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)
        inputs.at(1).setChecked(true)

        expect(wrapper.find("#dialog").exists()).toBe(true)
        expect(wrapper.vm.$data.uploadFilesToAdr).toMatchObject(["outputZip", "outputSummary"])
    })

    it(`can trigger close modal as expected`, async () => {
        const wrapper = mount(UploadModal, {store: createStore()})

        await wrapper.setProps({open: true})
        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");

        const buttons = modal.find(".modal-footer").findAll("button");
        await buttons.at(1).trigger("click")
        expect(wrapper.emitted("close").length).toBe(1)
    })

    it(`can call uploadFiles as expected`, () => {
        const mockUploadFiles = jest.fn()
        mount(UploadModal,
            {
                store: createStore(),
                computed: {
                    uploadFiles: mockUploadFiles
                }
            })
        expect(mockUploadFiles).toHaveBeenCalledTimes(1)
    })

    it(`can send upload files to ADR when download status is complete`, async () => {
        const downloadResults = {
            summary: {complete: true, downloading: false} as any,
            spectrum: {complete: true, downloading: false} as any,
            coarseOutput: {} as any
        }
        const store = createStore()
        const wrapper = mount(UploadModal, {store})

        await wrapper.setProps({open: true})
        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");

        //Refresh adrUpload upload files to trigger watch, which populates uploadFilesToADR
        store.state.adrUpload.uploadFiles= {...fakeMetadata};

        //Click ok to trigger population of uploadFilesPayload
        const okBtn = modal.find("button.btn-red");
        expect(okBtn.element)
        await okBtn.trigger("click");

        store.state.downloadResults = downloadResults
        await Vue.nextTick()
        expect(mockUploadFilesToADR.mock.calls.length).toBe(2)
        expect(mockUploadMetadataAction.mock.calls.length).toBe(2)
    });

    it(`ok button is enabled when inputs are set and triggers close modal`, async () => {
        const downloadResults = {
            summary: {complete: true} as any,
            spectrum: {complete: true} as any
        }
        const wrapper = mount(UploadModal, {store: createStore(fakeMetadata, downloadResults)})

        await wrapper.setProps({open: true})

        const okBtn = wrapper.find("button");
        expect(okBtn.attributes("disabled")).toBe("disabled");

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)
        inputs.at(1).setChecked(true)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")
        expect(wrapper.emitted("close").length).toBe(1)
    });

    it(`ok button is enabled when inputs are set and does not triggers close modal when downloading files`, async () => {
        const downloadResults = {
            summary: {downloading: true} as any,
            spectrum: {downloading: true} as any
        }
        const store = createStore(fakeMetadata, downloadResults)
        const wrapper = mount(UploadModal, {store})

        await wrapper.setProps({open: true})

        const okBtn = wrapper.find("button");
        expect(okBtn.attributes("disabled")).toBe("disabled");

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)
        inputs.at(1).setChecked(true)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")

        expect(wrapper.find(DownloadProgress).props())
            .toEqual({"downloading": true, "translateKey": "downloadProgressForADR"})
        expectTranslated(wrapper.find(DownloadProgress),
            "Preparing file(s) for upload...",
            "Préparer le(s) fichier(s) pour le téléchargement...",
            "Preparando arquivo(s) para upload...", store)
        expect(wrapper.emitted("close")).toBeUndefined()
    });

    it("can invoke summary and spectrum download action", async () => {
        const store = createStore();
        const wrapper = mount(UploadModal, {store})
        await wrapper.setProps({open: true})

        const okBtn = wrapper.find("button");
        expect(okBtn.attributes("disabled")).toBe("disabled");

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)
        inputs.at(1).setChecked(true)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")

        expect(mockSummaryDownload.mock.calls.length).toBe(1)
        expect(mockSpectrumDownload.mock.calls.length).toBe(1)
    });

    it("can clear timer when download action is complete", async () => {
        const store = createStore(fakeMetadata, {
            summary: {complete: false, downloading: false } as any,
            spectrum: {complete: false, downloading: false} as any
        });
        const wrapper = mount(UploadModal, {store})

        await wrapper.setProps({open: true})

        //Refresh adrUpload upload files to trigger watch, which populates uploadFilesToADR
        store.state.adrUpload.uploadFiles= {outputZip: fakeMetadata.outputZip};

        //Click ok to trigger population of uploadFilesPayload
        const okBtn = wrapper.find(".modal button.btn-red");
        expect(okBtn.element)
        await okBtn.trigger("click");

        wrapper.vm.$store.state.downloadResults.spectrum.complete = true;
        await Vue.nextTick()

        expect(clearInterval).toHaveBeenCalledTimes(1)
        expect(mockUploadFilesToADR.mock.calls.length).toBe(1)
        expect(wrapper.emitted().close.length).toBe(1)
    });

    it("can clear timer when any download action fails and does not send files to adr", async () => {
        const store = createStore();
        const wrapper = mount(UploadModal, {store})

        await wrapper.setProps({open: true})
        wrapper.vm.$store.state.downloadResults = failedDownloadResults
        await Vue.nextTick()

        expect(clearInterval).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted().close).toBeUndefined()
    });

    it("can invoke spectrum download action", async () => {
        const store = createStore();
        const wrapper = mount(UploadModal, {store})

        await wrapper.setProps({open: true})

        const okBtn = wrapper.find("button");
        expect(okBtn.attributes("disabled")).toBe("disabled");

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")

        expect(mockSummaryDownload.mock.calls.length).toBe(0)
        expect(mockSpectrumDownload.mock.calls.length).toBe(1)
    });

    it("can invoke summary download action", async () => {
        const store = createStore();
        const wrapper = mount(UploadModal, {store})

        await wrapper.setProps({open: true})

        const okBtn = wrapper.find("button");
        expect(okBtn.attributes("disabled")).toBe("disabled");

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(1).setChecked(true)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")

        expect(mockSummaryDownload.mock.calls.length).toBe(1)
        expect(mockSpectrumDownload.mock.calls.length).toBe(0)
    });

    it("does not render file section header when no input files", () => {
        const wrapper = mount(UploadModal, {store: createStore()});
        expect(wrapper.find("h5").exists()).toBe(false);
    });

    it("renders file section headers when there are input files", () => {
        const store = createStore(metadataWithInput);
        const wrapper = mount(UploadModal, {store});
        const headers = wrapper.findAll("h5");
        expect(headers.length).toBe(2);
        expectTranslated(headers.at(0), "Output Files", "Fichiers de sortie", "Ficheiros de saída", store);
        expectTranslated(headers.at(1), "Input Files", "Fichiers d'entrée", "Ficheiros de entrada", store);
    });

    it("renders input controls as expected when there are input files", () => {
        const store = createStore(metadataWithInput);
        const wrapper = mount(UploadModal, {store});

        const inputs = wrapper.findAll("input.form-check-input");
        expect(inputs.length).toBe(3);
        expect(inputs.at(0).attributes("id")).toBe("id-0-0");
        expect(inputs.at(0).attributes("value")).toBe("outputZip");
        expect(inputs.at(1).attributes("id")).toBe("id-0-1");
        expect(inputs.at(1).attributes("value")).toBe("outputSummary");
        expect(inputs.at(2).attributes("id")).toBe("id-1-0");
        expect(inputs.at(2).attributes("value")).toBe("population");

        const labels = wrapper.findAll("label.form-check-label");
        expect(labels.length).toBe(3);
        expect(labels.at(0).attributes("for")).toBe("id-0-0");
        expect(labels.at(1).attributes("for")).toBe("id-0-1");
        expect(labels.at(2).attributes("for")).toBe("id-1-0");
    });
})
