import {
    colorFunctionFromName,
    colourScaleStepFromMetadata,
    getColor,
    getColourRanges,
    getIndicatorRanges,
    iterateDataValues,
    roundRange,
    roundToContext,
    toIndicatorNameLookup
} from "../../../app/components/plots/utils";
import {interpolateMagma, interpolateWarm} from "d3-scale-chromatic";
import {Filter} from "../../../app/generated";
import {ColourScaleType} from "../../../app/store/plottingSelections/plottingSelections";
import {Dict, NumericRange} from "../../../app/types";

const indicators = [
    {
        indicator: "plhiv",
        value_column: "plhiv",
        name: "PLHIV",
        min: 0,
        max: 0,
        colour: "interpolateGreys",
        invert_scale: false
    },
    {
        indicator: "prevalence",
        value_column: "prevalence",
        name: "Prevalence",
        min: 0,
        max: 0,
        colour: "interpolateGreys",
        invert_scale: false
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
            max: 1
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
        {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 13, art_cov: 0.2, vls: 0.1, year: "2018"},
        {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 13, art_cov: 0.3, vls: 0.2, year: "2018"},
        {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 14, art_cov: 0.4, vls: 0.3, year: "2018"},
        {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 14, art_cov: 0.2, vls: 0.4, year: "2019"},
        {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 15, art_cov: 0.3, vls: 0.5, year: "2019"},
        {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 15, art_cov: 0.4, vls: 0.6, year: "2019"}
    ];

    const indicatorsMeta = [
        {
            indicator: "prevalence",
            value_column: "prevalence",
            name: "Prevalence",
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false
        },
        {
            indicator: "plhiv",
            value_column: "plhiv",
            name: "PLHIV",
            min: 0,
            max: 20,
            colour: "interpolateGreys",
            invert_scale: false
        },
        {
            indicator: "art_cov",
            value_column: "art_cov",
            name: "ART coverage",
            min: 0,
            max: 20,
            colour: "interpolateGreys",
            invert_scale: false
        },
        {
            indicator: "vls",
            value_column: "vls",
            name: "Viral Load Suppression",
            min: 0,
            max: 21,
            colour: "interpolateGreys",
            invert_scale: false
        },
        {
            indicator: "nonexistent_full",
            value_column: "ne_full",
            name: "Not In Data",
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false
        },
        {
            indicator: "nonexistent_filtered",
            value_column: "ne_filtered",
            name: "Not In Data",
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: false
        }
    ];

    const colourScales = {
        prevalence: {type: ColourScaleType.Default, customMin: 0, customMax: 0},
        plhiv: {type: ColourScaleType.DynamicFull, customMin: 0, customMax: 1},
        art_cov: {type: ColourScaleType.Custom, customMin: 0.1, customMax: 0.9},
        vls: {type: ColourScaleType.DynamicFiltered, customMin: 0, customMax: 0.1},
        nonexistent_full: {type: ColourScaleType.DynamicFull, customMin: 0, customMax: 1},
        nonexistent_filtered: {type: ColourScaleType.DynamicFiltered, customMin: 0, customMax: 1}
    };

    const filters = [{
        id: "year",
        column_id: "year",
        label: "Year",
        options: [{id: "2018", label: ""}, {id: "2019", label: ""}]
    }];
    const selectedFilterValues = {year: [{id: "2019", label: "2019"}]};

    const areaIds = ["MWI_1_1", "MWI_1_2"];

    const result = getColourRanges(data, indicatorsMeta, colourScales, filters, selectedFilterValues, areaIds);

    expect(result).toStrictEqual({
        prevalence: {min: 0, max: 1},
        plhiv: {min: 13, max: 15},
        art_cov: {min: 0.1, max: 0.9},
        vls: {min: 0.4, max: 0.5},
        nonexistent_full: {min: 0, max: 0},
        nonexistent_filtered: {min: 0, max: 0}
    });
});

it("getColouRanges for unknown scale type returns nothing", () => {
    const indicatorsMeta = [{
        indicator: "fakeIndicator",
        value_column: "fake",
        name: "fake",
        min: 0,
        max: 1,
        colour: "interpolateGreys",
        invert_scale: false
    }];
    const colourScales = {
        fakeIndicator: {type: 99 as ColourScaleType, customMin: 0, customMax: 0}
    };
    const result = getColourRanges([], indicatorsMeta, colourScales, [], {}, []);
    expect(result).toStrictEqual({});
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
            indicator: "plhiv",
            value_column: "plhiv",
            name: "PLHIV",
            min: 0,
            max: 0,
            colour: "interpolateGreys",
            invert_scale: false
        },
        {
            indicator: "prevalence",
            value_column: "prevalence",
            name: "Prevalence",
            min: 0,
            max: 0,
            colour: "interpolateGreys",
            invert_scale: false
        }
    ];
    expect(toIndicatorNameLookup(indicators)).toStrictEqual({
        plhiv: "PLHIV",
        prevalence: "Prevalence"
    });
});

it("round to context rounds values to 1 more decimal place than the context where context is integer", () => {
    expect(roundToContext(0.1234, [0, 1])).toBe(0.1);
});

it("round to context rounds values to 1 more decimal place than the context where context has fewer decimal places than value", () => {
    expect(roundToContext(0.1234, [0, 0.1])).toBe(0.12);
});

it("round to context does not round value if it already has fewer decimal places than context", () => {
    expect(roundToContext(0.1, [0, 0.12])).toBe(0.1);
});

it("round to context does not round value if both values and context are integers", () => {
    expect(roundToContext(5, [0, 10])).toBe(5);
});

it("round to context can round when context includes negative", () => {
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

it("can iterate data values and filter rows", () => {

    const indicators = [
        {
            indicator: "plhiv", value_column: "value", indicator_column: "indicator", indicator_value: "plhiv",
            name: "PLHIV", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "prevalence", value_column: "value", indicator_column: "indicator", indicator_value: "prev",
            name: "Prevalence", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
        }
    ];

    const data = [
        {area_id: "MWI_1_1", indicator: "plhiv", value: 12, year: 2010},
        {area_id: "MWI_1_1", indicator: "prev", value: 0.5, year: 2010},
        {area_id: "MWI_1_2", indicator: "plhiv", value: 14, year: 2010},
        {area_id: "MWI_1_2", indicator: "prev", value: 0.6, year: 2010},
        {area_id: "MWI_1_2", indicator: "plhiv", value: 14, year: 2010}
    ];

    const fakeFilter: Filter = {id: "year", column_id: "year", label: "year", options: [{id: "2010", label: "2010"}]};

    const result: number[] = [];
    iterateDataValues(data, indicators, ["MWI_1_1", "MWI_1_2"], [fakeFilter], {"year": [{id: "2010", label: "2010"}]},
        (areaId, meta, value) => result.push(value));

    expect(result).toStrictEqual([12, 0.5, 14, 0.6, 14]);
});

it("handles iterating data values where there are no selected filter options", () => {

    const indicators = [
        {
            indicator: "plhiv", value_column: "value", indicator_column: "indicator", indicator_value: "plhiv",
            name: "PLHIV", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "prevalence", value_column: "value", indicator_column: "indicator", indicator_value: "prev",
            name: "Prevalence", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
        }
    ];

    const data = [
        {area_id: "MWI_1_1", indicator: "plhiv", value: 12, year: 2010},
        {area_id: "MWI_1_1", indicator: "prev", value: 0.5, year: 2010},
        {area_id: "MWI_1_2", indicator: "plhiv", value: 14, year: 2010},
        {area_id: "MWI_1_2", indicator: "prev", value: 0.6, year: 2010},
        {area_id: "MWI_1_2", indicator: "plhiv", value: 14, year: 2010}
    ];

    const fakeFilter: Filter = {id: "year", column_id: "year", label: "year", options: [{id: "2010", label: "2010"}]};

    const result: number[] = [];
    iterateDataValues(data, indicators, ["MWI_1_1", "MWI_1_2"], [fakeFilter], {},
        (areaId, meta, value) => result.push(value));

    expect(result).toStrictEqual([]);
});
