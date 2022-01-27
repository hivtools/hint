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
import { Dict } from "../../../app/types";
import {Language} from "../../../app/store/translations/locales";
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
            },
    }

    const metadataWithInput = {
        ...fakeMetadata,
        population: {
            index: 3,
            displayName: "population",
            resourceType: "inputs-unaids-population",
            resourceFilename: "naomi-model-outputs-population.zip",
            resourceId: "123",
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
            downloadId: null,
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

    const getWrapper = (directives = {}) => {
        return shallowMount(UploadModal,
            {
                store: createStore(),
                directives
            })
    }

    it(`renders modal as expected`, async () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const dialog = wrapper.find("#dialog")
        expect(dialog.exists()).toBe(true)
        const text = dialog.find("h4")
        await Vue.nextTick()
        expectTranslated(text, "Upload to ADR", "Télécharger vers ADR", "Carregar para o ADR", store)
    })

    it(`renders dataset name as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const dataset = wrapper.find("#dialog").find("#dataset-id")
        expectTranslated(dataset, "Dataset: test title",
            "Base de données: test title", "Conjunto de dados: test title", store)
    })

    it(`renders radial options as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        expect(wrapper.find("#createRelease").exists()).toBe(true)
        expect(wrapper.find("#uploadFiles").exists()).toBe(true)
        const labels = wrapper.findAll('label')
        expectTranslated(labels.at(0), "Create a new ADR release (upload all files)",
            "Créer une nouvelle version ADR (télécharger tous les fichiers)", "Crie uma nova versão ADR (carregue todos os arquivos)", store)
        expectTranslated(labels.at(1), "Upload specific files",
            "Télécharger des fichiers spécifiques", "Faça upload de arquivos específicos", store)
        const circleIcons = wrapper.findAll('help-circle-icon-stub')
        expect(circleIcons.length).toBe(2)
    })

    it("can render tooltips in English, French, and Portuguese", () => {
        const mockTooltip = jest.fn();
        const wrapper = getWrapper({"tooltip": mockTooltip})

        expect(mockTooltip.mock.calls[0][1].value).toBe("Create a labelled version in the ADR dataset, to include all input and output files");
        expect(mockTooltip.mock.calls[1][1].value).toBe("Upload new versions of selected files without creating a release");

        const store = wrapper.vm.$store
        store.state.language = Language.fr;
        expect(mockTooltip.mock.calls[4][1].value).toBe("Créer une version étiquetée dans l'ensemble de données ADR, pour inclure tous les fichiers d'entrée et de sortie");
        expect(mockTooltip.mock.calls[5][1].value).toBe("Télécharger de nouvelles versions des fichiers sélectionnés sans créer de version");

        store.state.language = Language.pt;
        expect(mockTooltip.mock.calls[6][1].value).toBe("Crie uma versão rotulada no conjunto de dados ADR, para incluir todos os arquivos de entrada e saída");
        expect(mockTooltip.mock.calls[7][1].value).toBe("Faça upload de novas versões dos arquivos selecionados sem criar uma versão");
    });

    it(`renders Output files, inputs, and labels as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)
        expect(inputs.at(0).attributes("disabled")).toBe("disabled");
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
        const store = createStore(metadataWithInput)
        const wrapper = shallowMount(UploadModal, {store})
        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(3)

        const input1 =  inputs.at(0).element as HTMLInputElement
        expect(input1.checked).toBe(true)

        const input2 =  inputs.at(1).element as HTMLInputElement
        expect(input2.checked).toBe(true)

        const input3 =  inputs.at(2).element as HTMLInputElement
        expect(input3.checked).toBe(true)
    })

    it(`can check and get values from check boxes`, async () => {
        const wrapper = getWrapper()
        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")
        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)
        inputs.at(1).setChecked(true)

        expect(wrapper.find("#dialog").exists()).toBe(true)
        expect(wrapper.vm.$data.uploadFilesToAdr).toMatchObject(["outputZip", "outputSummary"])
    })

    it(`checkboxes are reset to default when switching back to create release`, async () => {
        const store = createStore({})
        const wrapper = shallowMount(UploadModal, {store})
        store.state.adrUpload.uploadFiles = metadataWithInput
        await Vue.nextTick()
        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")
        const inputs = wrapper.findAll("input[type='checkbox']")
        inputs.at(0).setChecked(false)
        inputs.at(1).setChecked(false)
        inputs.at(2).setChecked(false)
        const input1 =  inputs.at(0).element as HTMLInputElement
        expect(input1.checked).toBe(false)
        const input2 =  inputs.at(1).element as HTMLInputElement
        expect(input2.checked).toBe(false)
        const input3 =  inputs.at(2).element as HTMLInputElement
        expect(input3.checked).toBe(false)
        const radialInput2 = wrapper.find("#createRelease")
        await radialInput2.trigger("click")
        expect(input1.checked).toBe(true)
        expect(input2.checked).toBe(true)
        expect(input3.checked).toBe(true)
    })

    it(`can trigger close modal as expected`, async () => {
        const wrapper = mount(UploadModal, {store: createStore()})

        const modal = wrapper.find(".modal");
        expect(modal.classes()).toContain("show");

        const buttons = modal.find(".modal-footer").findAll("button");
        await buttons.at(1).trigger("click")
        expect(wrapper.emitted("close").length).toBe(1)
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

    it(`can set createRelease and upload files in uploadFilesToAdrAction`, async () => {
        const downloadResults = {
            summary: {complete: true, downloading: false} as any,
            spectrum: {complete: true, downloading: false} as any,
            coarseOutput: {} as any
        }
        const store = createStore(metadataWithInput, downloadResults)
        const wrapper = mount(UploadModal, {store})

        const modal = wrapper.find(".modal");
        store.state.adrUpload.uploadFiles= {...metadataWithInput};
        const okBtn = modal.find("button.btn-red");
        await okBtn.trigger("click");

        await Vue.nextTick()
        expect(wrapper.vm.$data.choiceUpload).toBe("createRelease")
        expect(mockUploadFilesToADR.mock.calls.length).toBe(1)
        const num = mockUploadFilesToADR.mock.calls[0].length -2
        expect(mockUploadFilesToADR.mock.calls[0][num]["uploadFiles"]).toStrictEqual([fakeMetadata["outputZip"],fakeMetadata["outputSummary"], metadataWithInput["population"]])
        expect(mockUploadFilesToADR.mock.calls[0][num]["createRelease"]).toBe(true)
    });

    it(`can set upload files in uploadFilesToAdrAction and not set createRelease`, async () => {
        const downloadResults = {
            summary: {complete: true, downloading: false} as any,
            spectrum: {complete: true, downloading: false} as any,
            coarseOutput: {} as any
        }
        const store = createStore(metadataWithInput, downloadResults)
        const wrapper = mount(UploadModal, {store})

        const modal = wrapper.find(".modal");
        store.state.adrUpload.uploadFiles= {...metadataWithInput};
        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")
        const okBtn = modal.find("button.btn-red");
        await okBtn.trigger("click");

        await Vue.nextTick()
        expect(wrapper.vm.$data.choiceUpload).toBe("uploadFiles")
        expect(mockUploadFilesToADR.mock.calls.length).toBe(1)
        const num = mockUploadFilesToADR.mock.calls[0].length -2
        expect(mockUploadFilesToADR.mock.calls[0][num]["uploadFiles"]).toStrictEqual([fakeMetadata["outputZip"],fakeMetadata["outputSummary"], metadataWithInput["population"]])
        expect(mockUploadFilesToADR.mock.calls[0][num]["createRelease"]).toBe(false)
    });

    it(`can remove some upload files from uploadFilesToAdrAction`, async () => {
        const downloadResults = {
            summary: {complete: true, downloading: false} as any,
            spectrum: {complete: true, downloading: false} as any,
            coarseOutput: {} as any
        }
        const store = createStore(metadataWithInput, downloadResults)
        const wrapper = mount(UploadModal, {store})

        const modal = wrapper.find(".modal");
        store.state.adrUpload.uploadFiles= {...metadataWithInput};
        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")

        const checkInputs = wrapper.findAll("input[type='checkbox']")
        await checkInputs.at(1).setChecked(false)
        await checkInputs.at(2).setChecked(false)
        const okBtn = modal.find("button.btn-red");
        await okBtn.trigger("click");

        await Vue.nextTick()
        expect(wrapper.vm.$data.choiceUpload).toBe("uploadFiles")
        expect(mockUploadFilesToADR.mock.calls.length).toBe(1)
        const num = mockUploadFilesToADR.mock.calls[0].length -2
        expect(mockUploadFilesToADR.mock.calls[0][num]["uploadFiles"]).toStrictEqual([fakeMetadata["outputZip"]])
        expect(mockUploadFilesToADR.mock.calls[0][num]["createRelease"]).toBe(false)
    });

    it(`ok button is enabled when inputs are set and triggers close modal`, async () => {
        const downloadResults = {
            summary: {complete: true} as any,
            spectrum: {complete: true} as any
        }
        const wrapper = mount(UploadModal, {store: createStore(fakeMetadata, downloadResults)})

        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")

        const okBtn = wrapper.find("button");

        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)

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

        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")

        const okBtn = wrapper.find("button");
        expect(okBtn.attributes("disabled")).toBe("disabled");

        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)
        expect(okBtn.text()).toBe("OK")

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
        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")

        const okBtn = wrapper.find("button");

        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")

        expect(mockSummaryDownload.mock.calls.length).toBe(1)
        expect(mockSpectrumDownload.mock.calls.length).toBe(1)
    });

    it("can clear timer when download action is complete", async () => {
        const store = createStore({outputZip: fakeMetadata.outputZip}, {
            summary: {complete: false, downloading: false } as any,
            spectrum: {complete: false, downloading: false } as any
        });
        const wrapper = mount(UploadModal, {store})


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

        wrapper.vm.$store.state.downloadResults = failedDownloadResults
        await Vue.nextTick()

        expect(clearInterval).toHaveBeenCalledTimes(1)
        expect(wrapper.emitted().close).toBeUndefined()
    });

    it("can invoke spectrum download action", async () => {
        const store = createStore();
        const wrapper = mount(UploadModal, {store})

        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")

        const okBtn = wrapper.find("button");

        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)
        inputs.at(1).setChecked(false)

        expect(okBtn.attributes("disabled")).toBeUndefined();
        expect(okBtn.text()).toBe("OK")
        await okBtn.trigger("click")

        expect(mockSummaryDownload.mock.calls.length).toBe(0)
        expect(mockSpectrumDownload.mock.calls.length).toBe(1)
    });

    it("can invoke summary download action", async () => {
        const store = createStore();
        const wrapper = mount(UploadModal, {store})

        const radialInput = wrapper.find("#uploadFiles")
        await radialInput.trigger("click")

        const okBtn = wrapper.find("button");

        const inputs = wrapper.findAll("input[type='checkbox']")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(false)

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

        const inputs = wrapper.findAll("input[type='checkbox']");
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

    it(`ok and cancel buttons are disabled when upload to ADR is in progress`, async () => {
        const downloadResults = {
            summary: {downloading: false} as any,
            spectrum: {downloading: true} as any
        }
        const wrapper = mount(UploadModal,
            {
                store: createStore(fakeMetadata, downloadResults),
                data() {
                    return {
                        uploadFilesToAdr: ["outputZip", "outputSummary"]
                    }
                }
            })

        const btn = wrapper.findAll("button");
        expect(btn.at(0).attributes("disabled")).toBe("disabled");
        expect(btn.at(1).attributes("disabled")).toBe("disabled");
    });

    it(`ok and cancel buttons are enabled when upload to Download/ADR is not in progress`, async () => {
        const wrapper = mount(UploadModal,
            {
                store: createStore(fakeMetadata),
                data() {
                    return {
                        uploadFilesToAdr: ["outputZip", "outputSummary"]
                    }
                }
            })

        const btn = wrapper.findAll("button");
        expect(btn.at(0).attributes("disabled")).toBeUndefined();
        expect(btn.at(1).attributes("disabled")).toBeUndefined();
    });

    it(`does not multiply files when ok button is triggered twice when uploading to ADR`, async () => {
        const wrapper = mount(UploadModal,
            {
                store: createStore(fakeMetadata),
                data() {
                    return {
                        uploadFilesToAdr: ["outputZip", "outputSummary"]
                    }
                }
            })

        const btn = wrapper.findAll("button");

        expect(wrapper.vm.$data.selectedUploadFiles.length).toBe(0)

        expect(btn.at(0).text()).toBe("OK")
        await btn.at(0).trigger("click")
        expect(wrapper.vm.$data.selectedUploadFiles.length).toBe(2)

        await btn.at(0).trigger("click")
        expect(wrapper.vm.$data.selectedUploadFiles.length).toBe(2)
    });
})
