import {initialiseColourScaleFromMetadata} from "../../../../app/components/plots/choropleth/utils";
import {ColourScaleType} from "../../../../app/store/plottingSelections/plottingSelections";
describe("Choropleth utils", () => {
    it("initialiseColourScaleFromMetatata sets min and max from meta", () => {
        const meta = {
            indicator: "prev",
            value_column: "prevalence",
            name: "Prevalence",
            min: 1.5,
            max: 2.5,
            colour: "interpolateGreys",
            invert_scale: false
        };

        const result = initialiseColourScaleFromMetadata(meta);
        expect(result.type).toBe(ColourScaleType.Default);
        expect(result.customMin).toBe(1.5);
        expect(result.customMax).toBe(2.5);
    });
});