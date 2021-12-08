import {shallowMount} from "@vue/test-utils";
import DropDown from "../../../app/components/header/DropDown.vue";
import LanguageMenuView from  "../../../app/components/header/LanguageMenuView.vue"

describe("Data Exploration Language menu", () => {

    it("displays language menu text and link", () => {
        const changeLang = jest.fn();
        const wrapper = shallowMount(LanguageMenuView, {
            propsData: {
                currentLanguage: "EN",
                changeLanguage: changeLang
            }
        });

        expect(wrapper.find(DropDown).exists()).toBe(true)
        expect(wrapper.find("drop-down-stub").attributes("text")).toBe("EN")
        expect(wrapper.find("drop-down-stub").props("changeLanguage")).toBe(changeLang)

        const languageDropDownText = wrapper.findAll("drop-down-stub a")
        expect(languageDropDownText.length).toBe(3)
        expect(languageDropDownText.at(0).text()).toBe("EN")
        expect(languageDropDownText.at(1).text()).toBe("FR")
        expect(languageDropDownText.at(2).text()).toBe("PT")
    });

});
