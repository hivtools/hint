import {
    colorFunctionFromName,
    getColor,
    getIndicatorRanges,
    toIndicatorNameLookup,
    roundToContext, colourScaleStepFromMetadata, getColourRanges
} from "../../../app/components/plots/utils";
import {interpolateMagma, interpolateWarm} from "d3-scale-chromatic";
import {ChoroplethIndicatorMetadata} from "../../../app/generated";
import {ColourScaleSelections, ColourScaleType} from "../../../app/store/plottingSelections/plottingSelections";

const indicators = [
    {
        indicator: "plhiv", value_column: "plhiv", name: "PLHIV", min: 0, max:0, colour: "interpolateGreys", invert_scale: false
    },
    {
        indicator: "prevalence", value_column: "prevalence", name: "Prevalence", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
    }
];

it("colorFunctionFromName returns color function", () => {
    const result = colorFunctionFromName("interpolateMagma");
    expect(result).toBe(interpolateMagma);
});

it("colorFunctionFromName returns default color function if named function does not exist", () => {
    const result = colorFunctionFromName("not-a-color-function");
    expect(result).toBe(interpolateWarm);
});

it("getColor calculates colour string", () => {
    const result = getColor(0.5, {
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: ""
        },
        {
            min: 0,
            max:1
        });

    expect(result).toEqual("rgb(151, 151, 151)");
});

it("getColor avoids dividing by zero if min equals max", () => {
    const result = getColor(0.5, {
            min: 0.5,
            max: 0.5,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: ""
        },
        {
            min: 0.5,
            max: 0.5
        });

    expect(result).toEqual("rgb(255, 255, 255)");
});

it("can get indicator ranges", () => {
    const data = [
        {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 15},
        {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 14},
        {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 13}
    ];

    const result = getIndicatorRanges(data, indicators);

    expect(result).toStrictEqual({
        plhiv: {min: 13, max: 15},
        prevalence: {min: 0.5, max: 0.7}
    });
});

it("can get colour ranges", () => {
    const data = [
        {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 15, art_cov: 0.2},
        {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 14, art_cov: 0.3},
        {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 13, art_cov: 0.4}
    ];

    const indicatorsMeta = [
        {
            indicator: "prevalence", value_column: "prevalence", name: "Prevalence", min: 0, max: 1, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "plhiv", value_column: "plhiv", name: "PLHIV", min: 0, max:20, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "art_cov", value_column: "art_cov", name: "ART coverage", min: 0, max:20, colour: "interpolateGreys", invert_scale: false
        }
    ];

    const colourScales = {
        prevalence: {type: ColourScaleType.Default, customMin: 0, customMax: 0},
        plhiv: {type: ColourScaleType.DynamicFull, customMin: 0, customMax: 1},
        art_cov: {type: ColourScaleType.Custom, customMin: 0.1, customMax: 0.9}
    };

    const result = getColourRanges(data, indicatorsMeta, colourScales);

    expect(result).toStrictEqual({
        prevalence: {min: 0, max: 1},
        plhiv: {min: 13, max: 15},
        art_cov: {min: 0.1, max: 0.9}
    });
});

it("getColor can invert color function", () => {
    const result = getColor(0, {
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: ""
        },
        {min: 0, max: 1});

    expect(result).toEqual("rgb(255, 255, 255)"); //0 = white in interpolateGreys

    const invertedResult = getColor(0, {
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: true,
            indicator: "test",
            value_column: "",
            name: ""
        }, {min: 0, max: 1});
    expect(invertedResult).toEqual("rgb(0, 0, 0)");
});

it("getColor can use custom min and max", () => {
    const result = getColor(0.5, {
        min: 0.2,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    }, {min: 0, max: 1});

    expect(result).toEqual("rgb(151, 151, 151)");
});

it("can get indicator name lookup", () => {
    const indicators = [
        {
            indicator: "plhiv", value_column: "plhiv", name: "PLHIV", min: 0, max:0, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "prevalence", value_column: "prevalence", name: "Prevalence", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
        }
    ];
    expect(toIndicatorNameLookup(indicators)).toStrictEqual({
        plhiv: "PLHIV",
        prevalence: "Prevalence"
    });
});

it ("round to context rounds values to 1 more decimal place than the context where context is integer", () => {
    expect(roundToContext(0.1234, 1)).toBe(0.1);
});

it ("round to context rounds values to 1 more decimal place than the context where context has fewer decimal places than value", () => {
    expect(roundToContext(0.1234, 0.1)).toBe(0.12);
});

it ("round to context does not round value if it already has fewer decimal places than context", () => {
    expect(roundToContext(0.1, 0.12)).toBe(0.1);
});

it ("round to context does not round value if both values and context are integers", () => {
    expect(roundToContext(5, 10)).toBe(5);
});

it("colourScaleStepFromMetadata returns expected value", () => {
    const meta = {
        min: 0,
        max: 1
    };
    expect(colourScaleStepFromMetadata(meta as any)).toBe(0.1);
});
