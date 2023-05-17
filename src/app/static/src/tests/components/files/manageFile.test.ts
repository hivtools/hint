import {shallowMount} from '@vue/test-utils';

import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import Tick from "../../../app/components/Tick.vue";
import FileUpload from "../../../app/components/files/FileUpload.vue";
import ManageFile from "../../../app/components/files/ManageFile.vue";
import {mockDataExplorationState, mockError} from "../../mocks";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import Vuex, {Store} from "vuex";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated, expectTranslatedWithStoreType} from "../../testHelpers";
import {DataExplorationState, initialDataExplorationState} from "../../../app/store/dataExploration/dataExploration";

describe("Manage file component", () => {

    const createStore = (customStore = initialDataExplorationState(), requireConfirmation = false) => {
        const store = new Vuex.Store({
            state: customStore,
            modules: {
                stepper: {
                    namespaced: true,
                    getters: {editsRequireConfirmation: () => requireConfirmation}
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    const createSut = (props?: any, slots?: any, store?: Store<DataExplorationState>) => {
        return shallowMount(ManageFile, {
            store: store || createStore(),
            props: {
                required: false,
                error: null,
                label: "PJNZ",
                valid: true,
                upload: jest.fn(),
                deleteFile: jest.fn(),
                name: "pjnz",
                accept: "csv",
                ...props
            },
            slots: slots
        });
    };


    it("renders label", () => {
        const wrapper = createSut({
            label: "Some title"
        });
        expect(wrapper.findComponent("label").text()).toBe("Some title");
    });

    it("renders file upload", () => {
        const uploadFn = jest.fn();
        const wrapper = createSut({
            name: "test-name",
            upload: uploadFn
        });
        const input = wrapper.findComponent(FileUpload);
        expect(input.props().accept).toBe("csv");
        expect(input.props().name).toBe("test-name");
        expect(input.props().upload).toBe(uploadFn);
    });

    it("renders can display ADR tag if file upload is from ADR", () => {

        const uploadFn = jest.fn();
        const wrapper = createSut({
            name: "test-name",
            upload: uploadFn,
            fromADR: true
        });
        const spans = wrapper.findComponent("span");
        expect(spans.text()).toBe("ADR");
    });

    it("renders existing file name if present", () => {
        const store = createStore();
        const wrapper = createSut({
            existingFileName: "existing-name.csv"
        }, undefined, store);
        expectTranslatedWithStoreType(wrapper.findComponent("label.file-name strong"), "File", "Fichier", "Ficheiro", store);
        expect(wrapper.findComponent("label.file-name").text()).toContain("existing-name.csv");
    });

    it("can translate required text", () => {
        const wrapper = createSut({
            required: true
        });

        expectTranslated(wrapper.findComponent("#required"),
            "(required)",
            "(obligatoire)",
            "(necessário)",
            wrapper.vm.$store)
    });

    it("renders red text for empty field if required is true", () => {
        const wrapper = createSut({
            required: true
        });
        expect(wrapper.findComponent("#required").exists()).toBe(true);
        expect(wrapper.findComponent("#required").text()).toBe("(required)");
        expect(wrapper.findComponent("#required").attributes("class")).toBe("small text-danger");
    });

    it("renders text for filled form if required is true", () => {
        const wrapper = createSut({
            required: true,
            existingFileName: "file.csv"
        });
        expect(wrapper.findComponent("#required").exists()).toBe(true);
        expect(wrapper.findComponent("#required").text()).toBe("(required)");
        expect(wrapper.findComponent("#required").attributes("class")).toBe("small");
    });

    it("does not render text if required is false", () => {
        const wrapper = createSut();
        expect(wrapper.findComponent("#required").exists()).toBe(false);
    });

    it("does not render tick if valid is false", () => {
        const wrapper = createSut({
            valid: false
        });
        expect(wrapper.findAllComponents(Tick).length).toBe(0);
    });

    it("renders tick if valid is true", () => {
        const wrapper = createSut({
            valid: true
        });
        expect(wrapper.findAllComponents(Tick).length).toBe(1);
    });

    it("does not render remove link if filename is not present and error is not present", () => {
        const wrapper = createSut({
            existingFileName: null,
            error: null
        });
        expect(wrapper.findAllComponents("a").length).toBe(0);
    });

    it("renders remove link if existing filename is present", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            existingFileName: "File.csv",
            deleteFile: removeHandler
        });
        const removeLink = wrapper.findComponent("a");
        expect(removeLink.text()).toBe("remove");

        removeLink.trigger("click");

        expect(removeHandler.mock.calls.length).toBe(1);
    });

    it("renders remove link if existing filename is present when on data exploration mode", () => {
        const removeHandler = jest.fn();

        const wrapper = shallowMount(ManageFile, {
            store: createStore(mockDataExplorationState(), true),
            props: {
                error: null,
                label: "PJNZ",
                valid: true,
                upload: jest.fn(),
                deleteFile: removeHandler,
                name: "pjnz",
                accept: "csv",
                existingFileName: "File.csv"
            }
        });

        const removeLink = wrapper.findComponent("a");
        expect(removeLink.text()).toBe("remove");

        removeLink.trigger("click");

        expect(removeHandler.mock.calls.length).toBe(1);
    });

    it("renders remove link if error is present", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            existingFileName: null,
            error: mockError("test error"),
            deleteFile: removeHandler
        });
        const removeLink = wrapper.findComponent("a");
        expect(removeLink.text()).toBe("remove");

        //should not render File label if no existing filename
        expectTranslated(wrapper.findComponent(".file-name"), "remove", "supprimer", "remover", wrapper.vm.$store);

        removeLink.trigger("click");

        expect(removeHandler.mock.calls.length).toBe(1);
    });

    it("renders error message if error is present", () => {
        const error = mockError("File upload went wrong");
        const wrapper = createSut({error});
        expect(wrapper.findComponent(ErrorAlert).props().error).toBe(error);
    });

    it("does not render error message if no error is present", () => {
        const wrapper = createSut();
        expect(wrapper.findAllComponents(ErrorAlert).length).toBe(0);
    });

    it("renders slot before filename", () => {

        const wrapper = createSut({
            existingFileName: "test.pjnz"
        }, {
            default: '<div class="fake-slot"></div>'
        });
        const slot = wrapper.findComponent(".fake-slot");
        expect(slot.element!!.nextElementSibling!!.classList[0]).toBe("file-name");
    });

    it("renders loading spinner while uploading with success", async () => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader,
            valid: false
        });

        expect(wrapper.findAllComponents(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAllComponents(Tick).length).toBe(0);

        wrapper.findComponent(FileUpload).vm.$emit("uploading")

        expect(wrapper.findAllComponents(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAllComponents(Tick).length).toBe(0);

        wrapper.setProps({valid: true});

        expect(wrapper.findAllComponents(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAllComponents(Tick).length).toBe(1);
    });

    it("renders loading spinner while uploading with error", async () => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader,
            valid: false,
            error: null
        });

        expect(wrapper.findAllComponents(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAllComponents(Tick).length).toBe(0);

        wrapper.findComponent(FileUpload).vm.$emit("uploading")

        expect(wrapper.findAllComponents(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAllComponents(Tick).length).toBe(0);

        wrapper.setProps({error: "Some error"});

        expect(wrapper.findAllComponents(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAllComponents(Tick).length).toBe(0);
    });
});
