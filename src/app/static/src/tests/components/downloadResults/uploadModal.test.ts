import {mount, shallowMount} from "@vue/test-utils";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {mockADRState, mockBaselineState, mockDatasetResource} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";

describe(`uploadModal `, () => {

    const fakeMetadata = {
        outputZip:
            {
                index: 1,
                displayName: "uploadFileOutputZip",
                resourceType: "inputs-unaids-naomi-output-zip",
                resourceFilename: "naomi-model-outputs-project1.zip",
                resourceId: null,
                resourceUrl: null,
                lastModified: null
            },
        outputSummary:
            {
                index: 2,
                displayName: "uploadFileOutputSummary",
                resourceType: "string",
                resourceFilename: "string",
                resourceId: "value",
                resourceUrl: null,
                lastModified: "2021-01-25T06:34:12.375649"
            }
    }

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
    const createStore = (data = fakeMetadata) => {
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
                adr: {
                    namespaced: true,
                    state: mockADRState({uploadFiles: data}),
                    actions: {
                        uploadFilesToADR: jest.fn()
                    },
                    mutations: {
                        ADRUploadStarted: jest.fn()
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
        expectTranslated(text, "Upload to ADR", "Télécharger vers ADR", store)
    })

    it(`renders dataset name as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const dataset = wrapper.find("#dialog").find("#dataset-id")
        expectTranslated(dataset, "Dataset: test title",
            "Base de données: test title", store)
    })

    it(`renders instructions text as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const instructions = wrapper.find("#instructions")
        expectTranslated(instructions,
            "Please select the new or modified files which should be uploaded",
            "Veuillez sélectionner les fichiers nouveaux ou modifiés qui doivent être téléchargés",
            store)
    })

    it(`renders Output files, inputs, overwritten text and labels as expected`, () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const overwriteText = wrapper.findAll("small")
        expect(overwriteText.length).toBe(1)
        expectTranslated(overwriteText.at(0), "This file already exists on ADR " +
            "and will be overwritten. File was updated 25/01/2021 06:34:12",
            "Ce fichier existe déjà sur ADR et sera écrasé. Le fichier a été mis à jour 25/01/2021 06:34:12", store)

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)

        const label = wrapper.findAll("label.form-check-label")
        expect(label.length).toBe(2)

        expectTranslated(label.at(0), "Model outputs", "Résultats du modèle", store)
        expectTranslated(label.at(1), "Summary report", "Rapport sommaire", store)
    })

    it(`checkboxes are set by default`, async () => {
        const wrapper = shallowMount(UploadModal, {store: createStore()})
        await wrapper.setData({uploadFilesToAdr: ["outputZip", "outputSummary"]})
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

    it(`ok button is enabled when inputs are set and triggers close modal`, async () => {
        const wrapper = mount(UploadModal, {store: createStore()})

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
    })
})
