import {shallowMount, Slots} from '@vue/test-utils';
import Vue from 'vue';

import ErrorAlert from "../../app/components/ErrorAlert.vue";
import Tick from "../../app/components/Tick.vue";
import FileUpload from "../../app/components/FileUpload.vue";
import {mockFile} from "../mocks";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";

describe("File upload component", () => {

    const createSut = (props?: any, slots?: Slots) => {
        return shallowMount(FileUpload, {
            propsData: {
                error: "",
                label: "",
                valid: true,
                upload: () => {
                },
                deleteFile: () => {

                },
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

        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);
        expect(wrapper.find(".custom-file label").text()).toBe("TEST");
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
        const removeHandler =jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        expect(removeHandler.mock.calls.length).toBe(1);
    });

    it("clears selected file on remove", () => {
        const removeHandler =jest.fn();
        const wrapper = createSut({
            valid: true,
            deleteFile: removeHandler
        });
        const removeLink = wrapper.find("a");
        expect(removeLink.text()).toBe("remove");
        removeLink.trigger("click");
        const fileName = wrapper.find(".custom-file label").text();
        expect(fileName).toBe("Choose a file");
        expect(wrapper.vm.$data.selectedFile).toBe(null);
    });

    it("renders error message if error is present", () => {
        const wrapper = createSut({
            error: "File upload went wrong"
        });
        expect(wrapper.find(ErrorAlert).props().message).toBe("File upload went wrong");
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

        const testFile = mockFile("TEST FILE NAME", "TEST CONTENTS");
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

        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);

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

        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);

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
            error: ""
        });

        expect(wrapper.findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.findAll(Tick).length).toBe(0);

        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);

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
            error: ""
        });

        expect(wrapper.find(".custom-file-label").classes()).not.toContain("uploading");
        expect(wrapper.find(".custom-file-label").attributes().disabled).toBeUndefined();

        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);

        expect(wrapper.find(".custom-file-label").classes()).toContain("uploading");
        expect(wrapper.find(".custom-file-label").attributes().disabled).not.toBeUndefined();

        wrapper.setProps({error: "Some error"});

        expect(wrapper.find(".custom-file-label").classes()).not.toContain("uploading");
        expect(wrapper.find(".custom-file-label").attributes().disabled).toBeUndefined();

    });


});
