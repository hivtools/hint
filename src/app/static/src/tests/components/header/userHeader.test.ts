import {shallowMount} from "@vue/test-utils";
import UserHeader from "../../../app/components/header/UserHeader.vue";
import FileMenu from "../../../app/components/header/FileMenu.vue";
import Translated from "../../../app/components/Translated.vue";
import LanguageMenu from "../../../app/components/header/LanguageMenu.vue";
import i18next from "i18next";
import {expectTranslatedText} from "../../testHelpers";

// jsdom has only implemented navigate up to hashes, hence appending a hash here to the base url
const mockCreateObjectUrl = jest.fn(() => "http://localhost#1234");
window.URL.createObjectURL = mockCreateObjectUrl;

describe("user header", () => {

    it("contains logout link", () => {
        const wrapper = shallowMount(UserHeader);
        const logoutLink = wrapper.find("a[href='/logout']");
        expectTranslatedText(logoutLink, "Logout");
    });

    it("renders file menu", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.findAll(FileMenu).length).toBe(1);
    });

    it("renders language menu", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.findAll(LanguageMenu).length).toBe(1);
    });

    it("contains bug report link", () => {
        const wrapper = shallowMount(UserHeader);
        const bugLink = wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7']");
        expectTranslatedText(bugLink, "Report a bug");
    });
});
