import {mutations} from "../../app/store/colourScales/mutations";
import {mockColourScales} from "../mocks";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {ColourScaleType} from "../../app/store/colourScales/colourScales";

describe("ColourScales mutations", () => {
    const colourScales = {
        prevalence: {
            type: ColourScaleType.Default
        }
    };

    it("UpdateSAPColourScales updates colour scales correctly for survey", () => {
        const testState = mockColourScales();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [DataType.Survey, colourScales]
        });
        expect(testState.survey).toBe(colourScales);
    });

    it("UpdateSAPColourScales updates colour scales correctly for program", () => {
        const testState = mockColourScales();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [DataType.Program, colourScales]
        });
        expect(testState.program).toBe(colourScales);
    });

    it("UpdateSAPColourScales updates colour scales correctly for anc", () => {
        const testState = mockColourScales();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [DataType.ANC, colourScales]
        });
        expect(testState.anc).toBe(colourScales);
    });
});