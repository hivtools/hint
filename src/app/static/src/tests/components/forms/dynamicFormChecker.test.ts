import {isDynamicFormMeta} from "../../../app/components/forms/dynamicFormChecker";

describe("dynamic form type checker", () => {

    it("should recognise non objects as invalid forms", () => {
        expect(isDynamicFormMeta(1)).toBe(false);
        expect(isDynamicFormMeta("hi")).toBe(false);
        expect(isDynamicFormMeta(null)).toBe(false);
        expect(isDynamicFormMeta({})).toBe(false);
    });

    it("should recognise missing control section labels as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{controlGroups: []}]
        })).toBe(false);
    });

    it("should recognise missing control groups as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{label: "l1"}]
        })).toBe(false);
    });

    it("should recognise invalid control group label", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1",
                controlGroups: [
                    {label: {}, controls: []}
                ]
            }]
        })).toBe(false);
    });

    it("should recognise control group label as optional", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1",
                controlGroups: [
                    {controls: []}
                ]
            }]
        })).toBe(true);
    });

    it("should recognise missing controls as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{}]
            }]
        })).toBe(false);
    });

    it("should recognise missing control name as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{required: false, type: "number"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise invalid helpText", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", helpText: false, required: false, type: "number"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise valid helpText", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", helpText: "Some help text", required: false, type: "number"}]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise wrong control type as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: false, type: "nonsense"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise missing required flag as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", type: "number"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise required property of wrong type as invalid", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: "yes", type: "number"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise valid number input", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1",
                controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "number"
                    }]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise valid number input with value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1",
                controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "number",
                        value: 10
                    }]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise valid number input with string value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1",
                controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "number",
                        value: "10"
                    }]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise invalid number input", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1",
                controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "number",
                        value: "wrong"
                    }]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise missing select options", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "select"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise invalid select options", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "select", options: ["opt"]}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise select input with invalid nested options", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "select",
                        options: [{id: "1", label: "l1", children: ["2"]}]
                    }]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise invalid select value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "select", options: ["opt"], value: ["1"]}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise valid select input", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "select", options: [{id: "1", label: "l1"}]}]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise valid select input with value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "select",
                        options: [{id: "1", label: "l1"}],
                        value: "1"
                    }]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise missing multiselect options", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "multiselect"}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise invalid multiselect options", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "multiselect", options: ["id"]}]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise invvalid multiselect value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "select",
                        options: [{id: "1", label: "l1"}],
                        value: {id: "1"}
                    }]
                }]
            }]
        })).toBe(false);
    });

    it("should recognise valid multiselect input", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{name: "i1", required: true, type: "multiselect", options: [{id: "1", label: "l1"}]}]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise valid multiselect input with string value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "multiselect",
                        options: [{id: "1", label: "l1"}],
                        value: "1"
                    }]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise valid multiselect input with array value", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "multiselect",
                        options: [{id: "1", label: "l1"}],
                        value: ["1"]
                    }]
                }]
            }]
        })).toBe(true);
    });

    it("should recognise valid select input with nested options", () => {
        expect(isDynamicFormMeta({
            controlSections: [{
                label: "l1", controlGroups: [{
                    controls: [{
                        name: "i1",
                        required: true,
                        type: "select",
                        options: [{id: "1", label: "l1", children: [{id: "2", label: "l2"}]}]
                    }]
                }]
            }]
        })).toBe(true);
    });

});
