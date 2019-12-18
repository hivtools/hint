import {shallowMount, Slots} from '@vue/test-utils';

import ErrorAlert from "../../app/components/ErrorAlert.vue";
import Tick from "../../app/components/Tick.vue";
import FileUpload from "../../app/components/FileUpload.vue";
import {mockError, mockFile} from "../mocks";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";

describe("File upload component", () => {

    const mockGetters = {
        editsRequireConfirmation: () => false,
        laterCompleteSteps: () => [{number: 4, text: "Run model"}]
    };

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                stepper: {
                    namespaced: true,
                    getters: mockGetters
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    const createSut = (props?: any, slots?: Slots) => {
        return shallowMount(FileUpload, {
            store: createStore(),
            propsData: {
                error: null,
                label: "",
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

    const testFile = mockFile("TEST FILE NAME", "TEST CONTENTS");

    it("renders label", () => {
        const wrapper = createSut({
            label: "Some title"
        });
        expect(wrapper.find("label").text()).toBe("Some title");
    });

    it("renders input", () => {
        const wrapper = createSut({
            name: "test-name"
        });
        const input = wrapper.find("input");
        expect(input.attributes().accept).toBe("csv");
        expect(input.attributes().id).toBe("test-name");
        expect(wrapper.find({ref: "test-name"})).toStrictEqual(input);
    });

    it("renders existing file name if present", () => {
        const wrapper = createSut({
            existingFileName: "existing-name.csv"
        });
        expect(wrapper.find(".custom-file label").text()).toBe("existing-name.csv");
    });

    it("overrides existing file name with new file name", () => {
        const wrapper = createSut({
            existingFileName: "existing-name.csv"
        });
        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();
        expect(wrapper.find(".custom-file label").text()).toBe("TEST FILE NAME");
    });

    it("does not render tick if valid is false", () => {
        const wrapper = createSut({
            valid: false
        });
        expect(wrapper.findAll(Tick).length).toBe(0);
    });

    it("renders tick if valid is true", () => {
        const wrapper = createSut({
            valid: true
        });
        expect(wrapper.findAll(Tick).length).toBe(1);
    });

    it("does not render remove link if valid is false", () => {
        const wrapper = createSut({
            valid: false
        });
        expect(wrapper.findAll("a").length).toBe(0);
    });

    it("renders remove link if valid is true", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        expect(removeHandler.mock.calls.length).toBe(1);
    });

    it("renders remove link if there are errors", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            valid: false,
            error: mockError("invalid file"),
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        expect(removeHandler.mock.calls.length).toBe(1);
    });

    it("clears selected file on remove", () => {
        const removeHandler = jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler,
            name: "pjnz"
        });

        const vm = wrapper.vm;
        (vm.$refs["pjnz"] as any) = {
            files: [testFile],
            value: "TEST FILE NAME"
        };

        wrapper.find("input").trigger("change");
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        const fileName = wrapper.find(".custom-file label").text();
        expect(fileName).toBe("Choose a file");
        expect(wrapper.vm.$data.selectedFile).toBe(null);
        expect((wrapper.vm.$refs["pjnz"] as HTMLInputElement).value).toBe("");
    });

    it("renders error message if error is present", () => {
        const error = mockError("File upload went wrong");
        const wrapper = createSut({error});
        expect(wrapper.find(ErrorAlert).props().error).toBe(error);
    });

    it("does not render error message if no error is present", () => {
        const wrapper = createSut();
        expect(wrapper.findAll(ErrorAlert).length).toBe(0);
    });

    it("renders slot before custom-file", () => {

        const wrapper = createSut({}, {
            default: '<div class="fake-slot"></div>'
        });
        const slot = wrapper.find(".fake-slot");
        expect(slot.element!!.nextElementSibling!!.classList[0]).toBe("custom-file");
    });

    it("calls upload when file is selected", (done) => {

        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        const vm = wrapper.vm;
        (vm.$refs as any).pjnz = {
            files: [testFile]
        };

        wrapper.find("input").trigger("change");

        setTimeout(() => {
            const formData = uploader.mock.calls[0][0] as FormData;
            expect(formData.get('file')).toBe(testFile);
            done();
        });

    });

    it("calls upload function with formData", (done) => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };

        (wrapper.vm as any).handleFileSelect();

        setTimeout(() => {
            expect(uploader.mock.calls[0][0] instanceof FormData).toBe(true);
            done();
        });
    });

    it("renders loading spinner while uploading with success", async () => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader,
            valid: false
        });

        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);
        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();

        expect(wrapper.findAll(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAll(Tick).length).toBe(0);

        wrapper.setProps({valid: true});

        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(1);
    });

    it("renders loading spinner while uploading with error", async () => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader,
            valid: false,
            error: null
        });

        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();

        expect(wrapper.findAll(LoadingSpinner).length).toBe(1);
        expect(wrapper.findAll(Tick).length).toBe(0);

        wrapper.setProps({error: "Some error"});

        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);
    });

    it("file input label is disabled with uploading class while uploading", async () => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader,
            valid: false,
            error: null
        });

        expect(wrapper.find(".custom-file-label").classes()).not.toContain("uploading");
        expect(wrapper.find(".custom-file-label").attributes().disabled).toBeUndefined();

        (wrapper.vm.$refs as any).pjnz = {
            files: [testFile]
        };
        (wrapper.vm as any).handleFileSelect();

        expect(wrapper.find(".custom-file-label").classes()).toContain("uploading");
        expect(wrapper.find(".custom-file-label").attributes().disabled).not.toBeUndefined();

        wrapper.setProps({error: "Some error"});

        expect(wrapper.find(".custom-file-label").classes()).not.toContain("uploading");
        expect(wrapper.find(".custom-file-label").attributes().disabled).toBeUndefined();

    });

});
