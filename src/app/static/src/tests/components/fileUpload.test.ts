import {shallowMount} from '@vue/test-utils';
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import Tick from "../../app/components/Tick.vue";
import FileUpload from "../../app/components/FileUpload.vue";
import {mockFileList} from "../mocks";

describe("File upload component", () => {

    const createSut = (props?: any) => {
        return shallowMount(FileUpload, {
            propsData: {
                error: "",
                label: "",
                valid: true,
                upload: () => {
                },
                name: "pjnz",
                accept: "csv",
                ...props
            }
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

    // TODO this is a massive pain - you can't programatically create a FileList
    // not sure of the best solution
    // https://github.com/jsdom/jsdom/issues/1272
    xit("calls upload when file is selected", (done) => {

        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.find("input").element as HTMLInputElement).files = mockFileList("TEST");

        wrapper.find("input").trigger("change");

        setTimeout(() => {
            expect(uploader.mock.calls[0][1]).toBe("TEST");
            done();
        });

    });

    it("calls upload function", (done) => {
        const uploader = jest.fn();
        const wrapper = createSut({
            upload: uploader
        });

        (wrapper.vm as any).handleFileSelect(null, [{name: "TEST"}] as any);

        setTimeout(() => {
            expect(uploader.mock.calls[0][0]).toStrictEqual({name: "TEST"});
            done();
        });
    });
});
