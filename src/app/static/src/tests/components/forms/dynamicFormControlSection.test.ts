import {mount, shallowMount} from "@vue/test-utils";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";
import {DynamicControlSection} from "../../../app/components/forms/fakeFormMeta";
import DynamicFormControlGroup from "../../../app/components/forms/DynamicFormControlGroup.vue";

describe('Dynamic form control section component', function () {

    const fakeFormSection: DynamicControlSection = {
        label: "Test 1",
        description: "Desc 1",
        controlGroups: [{
            label: "Group 1",
            controls: []
        }, {
            label: "Group 2",
            controls: []
        }]
    };

    it("renders label and description", () => {
        const rendered = mount(DynamicFormControlSection, {
            propsData: {
                controlSection: fakeFormSection
            }
        });

        expect(rendered.find("h3").text()).toBe("Test 1");
        expect(rendered.find("p").text()).toBe("Desc 1");
    });

    it("does not render description if absent", () => {
        const rendered = mount(DynamicFormControlSection, {
            propsData: {
                controlSection: {...fakeFormSection, description: null}
            }
        });

        expect(rendered.findAll("p").length).toBe(0);
    });

    it("renders control groups", () => {
        const rendered = shallowMount(DynamicFormControlSection, {
            propsData: {
                controlSection: fakeFormSection
            }
        });

        expect(rendered.findAll(DynamicFormControlGroup).length).toBe(2);
        expect(rendered.findAll(DynamicFormControlGroup).at(0).props("controlGroup"))
            .toStrictEqual({
                label: "Group 1",
                controls: []
            });
    });

});