import {shallowMount} from "@vue/test-utils";
import UploadModal from "../../../app/components/downloadResults/UploadModal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import {mockBaselineState, mockDatasetResource} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";
import Vue from "vue"

describe(`uploadModal `, () => {

    const fakeMetadata = {
        outputZip:
            {
                displayName: "Model outputs",
                resourceType: "inputs-unaids-naomi-output-zip",
                resourceFilename: "naomi-model-outputs-project1.zip",
                resourceId: null,
                lastModified: null,
                resourceUrl: null
            },
        outputSummary:
            {
                displayName: "Summary",
                resourceType: "string",
                resourceFilename: "string",
                resourceId: "value",
                lastModified: "24/02/21 17:22",
                resourceUrl: null
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
    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState(
                        {
                            selectedDataset:
                                {id: "1", url: "example.com", title: "test title", resources: mockResources}
                        })
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    const getWrapper = (data = fakeMetadata) => {
        return shallowMount(UploadModal,
            {
                store: createStore(),
                propsData: {outputFileMetadata: data}
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
        expect(overwriteText.at(0).text()).toBe("This file already exists on ADR " +
            "and will be overwritten. File was updated 24/02/21 17:22")

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)

        const label = wrapper.findAll("label.form-check-label")
        expect(label.length).toBe(2)

        expectTranslated(label.at(0), "Model outputs", "Sorties du modèle", store)
        expectTranslated(label.at(1), "Summary report", "Rapport sommaire", store)
    })

    it(`can check and get values from check boxes`, async () => {
        const wrapper = getWrapper()
        const store = wrapper.vm.$store

        const inputs = wrapper.findAll("input.form-check-input")
        expect(inputs.length).toBe(2)
        inputs.at(0).setChecked(true)
        inputs.at(1).setChecked(true)

        expect(wrapper.find("#dialog").exists()).toBe(true)
        expect(wrapper.vm.$data.pushFilesToAdr).toMatchObject(["Model outputs", "Summary"])
    })

    it(`can set and get description value as expected`, async () => {
        const wrapper = getWrapper()
        const newDesc = "new description"

        const desc = wrapper.find("#description-id")
        desc.setValue(newDesc)
        expect(wrapper.vm.$data.pushDescToAdr).toBe(newDesc)

        const textarea = desc.element as HTMLTextAreaElement
        expect(textarea.value).toBe(newDesc)
    })
})