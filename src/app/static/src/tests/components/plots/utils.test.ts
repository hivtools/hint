import {
    colorFunctionFromName,
    getColor,
    getIndicatorRange,
    toIndicatorNameLookup,
    roundToContext, colourScaleStepFromMetadata, roundRange, getDynamicFilteredColourRange
} from "../../../app/components/plots/utils";
import {interpolateMagma, interpolateWarm} from "d3-scale-chromatic";

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

it("can get indicator range", () => {
    const data = [
        {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 15},
        {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 14},
        {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 13}
    ];

    const result = getIndicatorRange(data, indicators[0]);

    expect(result).toStrictEqual({
        plhiv: {min: 13, max: 15},
        prevalence: {min: 0.5, max: 0.7}
    });
});

it("can get dynamic filtered colour range", () => {
    const data = [
        {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 13, art_cov: 0.2, vls: 0.1, year: "2018"},
        {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 13, art_cov: 0.3, vls: 0.2, year: "2018"},
        {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 14, art_cov: 0.4, vls: 0.3, year: "2018"},
        {area_id: "MWI_1_1", prevalence: 0.6, plhiv: 14, art_cov: 0.2, vls: 0.4, year: "2019"},
        {area_id: "MWI_1_2", prevalence: 0.7, plhiv: 15, art_cov: 0.3, vls: 0.5, year: "2019"},
        {area_id: "MWI_1_3", prevalence: 0.8, plhiv: 15, art_cov: 0.4, vls: 0.6, year: "2019"}
    ];

    const indicatorMeta =
        {
            indicator: "prevalence", value_column: "prevalence", name: "Prevalence", min: 0, max: 1, colour: "interpolateGreys", invert_scale: false
        };

    const filters = [{id: "year", column_id: "year", label: "Year", options: [{id: "2018", label: ""}, {id: "2019", label: ""}]}];
    const selectedFilterValues = {year: [{id: "2019", label: "2019"}]};

    const areaIds = ["MWI_1_1", "MWI_1_2"];

    const result = getDynamicFilteredColourRange(data, indicatorMeta, filters, selectedFilterValues, areaIds);

    expect(result).toStrictEqual({min: 0.6, max: 0.8});
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


it("getColor can get expected colour when value is less than min", () => {
    const result = getColor(0.5, {
        min: 1,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    }, {min: 1, max: 2});

    expect(result).toEqual("rgb(255, 255, 255)");
});

it("getColor can get expected colour when value is greater than max", () => {
    const result = getColor(5, {
        min: 1,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    }, {min: 1, max: 2});

    expect(result).toEqual("rgb(0, 0, 0)");
});

it("getColor can use negative min and zero max", () => {
    const metadata = {
        min: 0,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    };
    let result = getColor(-0.45, metadata, {min: -0.45, max: 0});
    expect(result).toEqual("rgb(255, 255, 255)");
    result = getColor(0, metadata, {min: -0.45, max: 0});
    expect(result).toEqual("rgb(0, 0, 0)");
    result = getColor(-0.225, metadata, {min: -0.45, max: 0});
    expect(result).toEqual("rgb(151, 151, 151)");

    //Test out of range
    result = getColor(-0.9, metadata, {min: -0.45, max: 0});
    expect(result).toEqual("rgb(255, 255, 255)");
    result = getColor(1, metadata, {min: -0.45, max: 0});
    expect(result).toEqual("rgb(0, 0, 0)");
});

it("getColor can use negative min and positive max", () => {
    const metadata = {
        min: 0,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    };
    let result = getColor(-10, metadata, {min: -10, max: 10});
    expect(result).toEqual("rgb(255, 255, 255)");
    result = getColor(10, metadata, {min: -10, max: 10});
    expect(result).toEqual("rgb(0, 0, 0)");
    result = getColor(0, metadata, {min: -10, max: 10});
    expect(result).toEqual("rgb(151, 151, 151)");

    //Test out of range
    result = getColor(-10.5, metadata, {min: -10, max: 10});
    expect(result).toEqual("rgb(255, 255, 255)");
    result = getColor(11, metadata, {min: -10, max: 10});
    expect(result).toEqual("rgb(0, 0, 0)");
});

it("getColor can use negative min and negative max", () => {
    const metadata = {
        min: 0,
        max: 2,
        colour: "interpolateGreys",
        invert_scale: false,
        indicator: "test",
        value_column: "",
        name: ""
    };
    let result = getColor(-10, metadata, {min: -10, max: -5});
    expect(result).toEqual("rgb(255, 255, 255)");
    result = getColor(-5, metadata, {min: -10, max: -5});
    expect(result).toEqual("rgb(0, 0, 0)");
    result = getColor(-7.5, metadata, {min: -10, max: -5});
    expect(result).toEqual("rgb(151, 151, 151)");

    //Test out of range
    result = getColor(-11, metadata, {min: -10, max: -5});
    expect(result).toEqual("rgb(255, 255, 255)");
    result = getColor(0, metadata, {min: -10, max: -5});
    expect(result).toEqual("rgb(0, 0, 0)");
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
    expect(roundToContext(0.1234, [0, 1])).toBe(0.1);
});

it ("round to context rounds values to 1 more decimal place than the context where context has fewer decimal places than value", () => {
    expect(roundToContext(0.1234, [0, 0.1])).toBe(0.12);
});

it ("round to context does not round value if it already has fewer decimal places than context", () => {
    expect(roundToContext(0.1, [0, 0.12])).toBe(0.1);
});

it ("round to context does not round value if both values and context are integers", () => {
    expect(roundToContext(5, [0, 10])).toBe(5);
});

it ("round to context can round when context includes negative", () => {
    expect(roundToContext(-0.3614, [-0.45, 0])).toBe(-0.361);
});

it("colourScaleStepFromMetadata returns expected value", () => {
    const meta = {
        min: 0,
        max: 1
    };
    expect(colourScaleStepFromMetadata(meta as any)).toBe(0.1);
});

it("roundRange rounds as expected", () => {
    expect(roundRange({min: 0.31432, max: 0.84162})).toStrictEqual({min: 0.31, max: 0.84});

    expect(roundRange({min: 0.031432, max: 0.084162})).toStrictEqual({min: 0.031, max: 0.084});

    expect(roundRange({min: 3.11, max: 4.12})).toStrictEqual({min: 3.1, max: 4.1});

    expect(roundRange({min: 101, max: 201})).toStrictEqual({min: 101, max: 201});

    expect(roundRange({min: 1.1234, max: 1.1235})).toStrictEqual({min: 1.1234, max: 1.1235});
    expect(roundRange({min: 1.1234566001, max: 1.123457001})).toStrictEqual({min: 1.1234566, max: 1.123457});
});

it("roundRange can round where max equals min", () => {
    expect(roundRange({min: 0.314, max: 0.314})).toStrictEqual({min: 0.31, max: 0.31});
    expect(roundRange({min: 10, max: 10})).toStrictEqual({min: 10, max: 10});
});
