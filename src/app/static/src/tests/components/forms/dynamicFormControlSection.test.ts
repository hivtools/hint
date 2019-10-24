import {mount} from "@vue/test-utils";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";
import {DynamicControlSection} from "../../../app/components/forms/types";
import DynamicFormControlGroup from "../../../app/components/forms/DynamicFormControlGroup.vue";

describe('Dynamic form control section component', function () {

    const fakeFormSection: DynamicControlSection = {
        label: "Test 1",
        description: "Desc 1",
        controlGroups: [{
            label: "Group 1",
            controls: [{
                type: "number",
                name: "id_1",
                required: false
            }]
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

    it("renders control groups", async () => {
        const controlSection = {...fakeFormSection};
        const rendered = mount(DynamicFormControlSection, {
            propsData: {
                controlSection: controlSection
            }
        });

        expect(rendered.findAll(DynamicFormControlGroup).length).toBe(2);
        expect(rendered.findAll(DynamicFormControlGroup).at(0).props("controlGroup"))
            .toStrictEqual(controlSection.controlGroups[0]);
    });

    it("emits change event when child component does", () => {
        const controlSection = {...fakeFormSection};
        const rendered = mount(DynamicFormControlSection, {
            propsData: {
                controlSection: controlSection
            }
        });

        const updatedControlGroup = {...controlSection.controlGroups[0]};
        updatedControlGroup.controls[0] = "TEST" as any;
        rendered.findAll(DynamicFormControlGroup).at(0)
            .vm.$emit("change", updatedControlGroup);

        expect((rendered.emitted("change")[0][0] as DynamicControlSection)
            .controlGroups[0].controls[0]).toBe("TEST");
    });

});