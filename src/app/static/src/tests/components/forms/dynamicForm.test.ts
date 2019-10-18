import Vue from "vue";

import {DynamicFormMeta, NumberControl, SelectControl} from "../../../app/components/forms/types";
import {mount, shallowMount} from "@vue/test-utils";
import DynamicFormComponent from "../../../app/components/forms/DynamicForm.vue";
import DynamicFormControlSection from "../../../app/components/forms/DynamicFormControlSection.vue";

describe('Dynamic form component', function () {

    const fakeFormMeta: DynamicFormMeta = {
        controlSections: [
            {
                label: "Test 1",
                controlGroups: []
            },
            {
                label: "Test 2",
                controlGroups: [{
                    label: "Group 1",
                    controls: [
                        {
                            name: "id_1",
                            type: "number",
                            required: true
                        } as NumberControl,
                        {
                            name: "id_2",
                            type: "number",
                            required: false
                        } as NumberControl
                    ]
                }]
            }
        ]
    };

    const formMetaWithAllControlTypes = {
        ...fakeFormMeta
    };

    formMetaWithAllControlTypes.controlSections[1].controlGroups[0].controls.push({
            name: "id_3",
            type: "multiselect",
            options: [{id: "opt1", label: "option 1"}],
            required: false
        } as SelectControl,
        {
            name: "id_4",
            type: "select",
            options: [{id: "opt2", label: "option 2"}],
            required: false
        } as SelectControl);

    it("renders form with id", () => {
        const rendered = mount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta,
                id: "test-id"
            },
            sync: false
        });

        const form = rendered.find("form");
        expect((form.vm.$refs["test-id"] as Element).tagName).toBe("FORM");
        expect(form.classes()).toContain("dynamic-form")
    });

    it("generates default id if not provided", () => {
        const rendered = shallowMount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            },
            sync: false
        });

        expect(rendered.vm.$props.id).toBeDefined();
    });

    it("renders control sections", () => {
        const rendered = shallowMount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            },
            sync: false
        });

        expect(rendered.findAll(DynamicFormControlSection).length).toBe(2);
        expect(rendered.findAll(DynamicFormControlSection).at(0).props("controlSection"))
            .toStrictEqual({
                label: "Test 1",
                controlGroups: []
            });
    });

    it("does not render button if includeSubmitButton is false", () => {

        const rendered = shallowMount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta,
                includeSubmitButton: false
            },
            sync: false
        });

        expect(rendered.findAll("button").length).toBe(0);
    });

    it("adds was-validated class on submit", async () => {
        const rendered = mount(DynamicFormComponent, {
            propsData: {
                formMeta: fakeFormMeta
            },
            sync: false
        });

        rendered.find("button").trigger("click");
        await Vue.nextTick();
        expect(rendered.classes()).toContain("was-validated");
    });

    describe("valid submission", () => {

        it("emits event with serialised form data on button submit", () => {

            const rendered = mount(DynamicFormComponent, {
                propsData: {
                    formMeta: formMetaWithAllControlTypes
                },
                sync: false
            });

            rendered.find("[name=id_1]").setValue(10);
            rendered.find("[name=id_3]").setValue("opt1,opt2");
            rendered.find("button").trigger("click");
            expect(rendered.emitted("submit")[0][0]).toStrictEqual({
                "id_1": "10",
                "id_2": null,
                "id_3": ["opt1", "opt2"],
                "id_4": null
            });
        });

        it("emits event and returns serialised form data on programmatic submit", () => {

            const rendered = mount(DynamicFormComponent, {
                propsData: {
                    formMeta: formMetaWithAllControlTypes
                },
                sync: false
            });

            rendered.find("[name=id_1]").setValue(10);
            const result = (rendered.vm as any).submit();
            const expected = {
                data: {
                    "id_1": "10",
                    "id_2": null,
                    "id_3": [],
                    "id_4": null
                },
                valid: true,
                missingValues: []
            };
            expect(rendered.emitted("submit")[0][0]).toStrictEqual(expected.data);
            expect(result).toStrictEqual(expected);
        });
    });

    describe("invalid submission", () => {

        it("does not emit event on button submit", () => {

            const rendered = mount(DynamicFormComponent, {
                propsData: {
                    formMeta: formMetaWithAllControlTypes
                },
                sync: false
            });

            rendered.find("button").trigger("click");
            expect(rendered.emitted("submit")).toBeUndefined();
        });

        it("returns validation data and does not emit event on programmatic submit", () => {

            const rendered = mount(DynamicFormComponent, {
                propsData: {
                    formMeta: formMetaWithAllControlTypes
                },
                sync: false
            });

            const result = (rendered.vm as any).submit();
            expect(rendered.emitted("submit")).toBeUndefined();
            expect(result).toStrictEqual({
                valid: false,
                data: {"id_1": null, "id_2": null, "id_3": [], "id_4": null},
                missingValues: ["id_1"]
            });
        });
    })

});