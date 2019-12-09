import {shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";

// jsdom has only implemented navigate up to hashes, hence appending a hash here to the base url
const mockCreateObjectUrl = jest.fn(() => "http://localhost#1234");
window.URL.createObjectURL = mockCreateObjectUrl;

describe("user header", () => {

    it("contains logout link", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.find("a[href='/logout']")).toBeDefined();
    });

    it("renders file menu", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.findAll(FileMenu).length).toBe(1);
    });

    it("contains bug report link", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7']")).toBeDefined();
    });
});
