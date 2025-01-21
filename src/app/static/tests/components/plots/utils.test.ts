import {
    colourFunctionFromName,
    formatLegend,
    formatOutput,
    getColour,
    getColourScaleLevels,
    getIndicatorMetadata,
    getIndicatorRange,
    getVisibleFeatures,
    roundRange,
    roundToContext
} from "../../../src/components/plots/utils";
import {Mock} from "vitest";
import {interpolateMagma, interpolateWarm} from "d3-scale-chromatic";
import {ScaleSettings, ScaleType} from "../../../src/store/plotState/plotState";
import {CalibrateDataResponse, IndicatorMetadata} from "../../../src/generated";
import {Store} from "vuex";
import {mockCalibrateMetadataResponse, mockModelCalibrateState, mockRootState} from "../../mocks";
import {RootState} from "../../../src/root";
import {Feature} from "geojson";

describe("plot utils", () => {

    const warnMock = vi.fn();

    beforeEach(() => {
        console.warn = warnMock;
    });

    afterEach(() => {
        (console.warn as Mock).mockClear();
    });

    it("colorFunctionFromName returns color function", () => {
        const result = colourFunctionFromName("interpolateMagma");
        expect(result).toBe(interpolateMagma);
    });

    it("colorFunctionFromName returns default color function if named function does not exist", () => {
        const result = colourFunctionFromName("not-a-color-function");
        expect(result).toBe(interpolateWarm);
        expect(warnMock).toBeCalledWith("Unknown color function: not-a-color-function");
    });

    it("getColour calculates colour string", () => {
        const result = getColour(0.5, {
                min: 0,
                max: 1,
                colour: "interpolateGreys",
                invert_scale: false,
                indicator: "test",
                value_column: "",
                name: "",
                format: "0.00%",
                scale: 1,
                accuracy: null
            },
            {
                min: 0,
                max: 1
            });

        expect(result).toEqual("rgb(151, 151, 151)");
    });

    it("getColour avoids dividing by zero if min equals max", () => {
        const result = getColour(0.5, {
                min: 0.5,
                max: 0.5,
                colour: "interpolateGreys",
                invert_scale: false,
                indicator: "test",
                value_column: "",
                name: "",
                format: "0.00%",
                scale: 1,
                accuracy: null
            },
            {
                min: 0.5,
                max: 0.5
            });

        expect(result).toEqual("rgb(255, 255, 255)");
    });

    it("getColour can invert color function", () => {
        const result = getColour(0, {
                min: 0,
                max: 1,
                colour: "interpolateGreys",
                invert_scale: false,
                indicator: "test",
                value_column: "",
                name: "",
                format: "0.00%",
                scale: 1,
                accuracy: null
            },
            {min: 0, max: 1});

        expect(result).toEqual("rgb(255, 255, 255)"); //0 = white in interpolateGreys

        const invertedResult = getColour(0, {
            min: 0,
            max: 1,
            colour: "interpolateGreys",
            invert_scale: true,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        }, {min: 0, max: 1});
        expect(invertedResult).toEqual("rgb(0, 0, 0)");
    });

    it("getColour can use custom min and max", () => {
        const result = getColour(0.5, {
            min: 0.2,
            max: 2,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        }, {min: 0, max: 1});

        expect(result).toEqual("rgb(151, 151, 151)");
    });

    it("getColour can get expected colour when value is less than min", () => {
        const result = getColour(0.5, {
            min: 1,
            max: 2,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        }, {min: 1, max: 2});

        expect(result).toEqual("rgb(255, 255, 255)");
    });

    it("getColour can get expected colour when value is greater than max", () => {
        const result = getColour(5, {
            min: 1,
            max: 2,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        }, {min: 1, max: 2});

        expect(result).toEqual("rgb(0, 0, 0)");
    });

    it("getColour can use negative min and zero max", () => {
        const metadata = {
            min: 0,
            max: 2,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        };
        let result = getColour(-0.45, metadata, {min: -0.45, max: 0});
        expect(result).toEqual("rgb(255, 255, 255)");
        result = getColour(0, metadata, {min: -0.45, max: 0});
        expect(result).toEqual("rgb(0, 0, 0)");
        result = getColour(-0.225, metadata, {min: -0.45, max: 0});
        expect(result).toEqual("rgb(151, 151, 151)");

        //Test out of range
        result = getColour(-0.9, metadata, {min: -0.45, max: 0});
        expect(result).toEqual("rgb(255, 255, 255)");
        result = getColour(1, metadata, {min: -0.45, max: 0});
        expect(result).toEqual("rgb(0, 0, 0)");
    });

    it("getColour can use negative min and positive max", () => {
        const metadata = {
            min: 0,
            max: 2,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        };
        let result = getColour(-10, metadata, {min: -10, max: 10});
        expect(result).toEqual("rgb(255, 255, 255)");
        result = getColour(10, metadata, {min: -10, max: 10});
        expect(result).toEqual("rgb(0, 0, 0)");
        result = getColour(0, metadata, {min: -10, max: 10});
        expect(result).toEqual("rgb(151, 151, 151)");

        //Test out of range
        result = getColour(-10.5, metadata, {min: -10, max: 10});
        expect(result).toEqual("rgb(255, 255, 255)");
        result = getColour(11, metadata, {min: -10, max: 10});
        expect(result).toEqual("rgb(0, 0, 0)");
    });

    it("getColour can use negative min and negative max", () => {
        const metadata = {
            min: 0,
            max: 2,
            colour: "interpolateGreys",
            invert_scale: false,
            indicator: "test",
            value_column: "",
            name: "",
            format: "0.00%",
            scale: 1,
            accuracy: null
        };
        let result = getColour(-10, metadata, {min: -10, max: -5});
        expect(result).toEqual("rgb(255, 255, 255)");
        result = getColour(-5, metadata, {min: -10, max: -5});
        expect(result).toEqual("rgb(0, 0, 0)");
        result = getColour(-7.5, metadata, {min: -10, max: -5});
        expect(result).toEqual("rgb(151, 151, 151)");

        //Test out of range
        result = getColour(-11, metadata, {min: -10, max: -5});
        expect(result).toEqual("rgb(255, 255, 255)");
        result = getColour(0, metadata, {min: -10, max: -5});
        expect(result).toEqual("rgb(0, 0, 0)");
    });

    it("can get indicator range", () => {
        const calibrateDataRow = (area_id: string, indicator: string, mean: number) => {
            return {
                area_id: area_id,
                sex: "both",
                age_group: "1",
                calendar_quarter: "1",
                indicator: indicator,
                mean: mean
            }
        }

        const data = [
            calibrateDataRow("MWI_1_1", "prevalence", 0.5),
            calibrateDataRow("MWI_1_2", "prevalence", 0.6),
            calibrateDataRow("MWI_1_3", "prevalence", 0.7),
            calibrateDataRow("MWI_1_1", "plhiv", 15),
            calibrateDataRow("MWI_1_2", "plhiv", 14),
            calibrateDataRow("MWI_1_3", "plhiv", 13),
        ] as CalibrateDataResponse["data"];

        const plhiv = {
            indicator: "plhiv",
            value_column: "mean",
            name: "PLHIV",
            min: 0,
            max: 100,
            colour: "interpolateGreys",
            invert_scale: false,
            format: "0.00%",
            scale: 1,
            accuracy: null
        };

        const defaultScale: ScaleSettings = {type: ScaleType.Default, customMin: 0, customMax: 0.5}
        const dynamicFilteredScale: ScaleSettings = {type: ScaleType.DynamicFiltered, customMin: 0, customMax: 0.5}
        const customScale: ScaleSettings = {type: ScaleType.Custom, customMin: 0, customMax: 0.5}

        let result = getIndicatorRange(plhiv, defaultScale, data);
        expect(result).toStrictEqual({min: 0, max: 100});

        result = getIndicatorRange(plhiv, customScale, data);
        expect(result).toStrictEqual({min: 0, max: 0.5});

        result = getIndicatorRange(plhiv, dynamicFilteredScale, data);
        expect(result).toStrictEqual({min: 13, max: 15});

        result = getIndicatorRange(plhiv, undefined as any, data);
        expect(result).toStrictEqual({min: 13, max: 15});

        const prev = {
            indicator: "prevalence",
            value_column: "mean",
            name: "prevalence",
            min: 0,
            max: 0,
            colour: "interpolateGreys",
            invert_scale: false,
            format: "0.00%",
            scale: 1,
            accuracy: null
        };
        result = getIndicatorRange(prev, dynamicFilteredScale, data);

        expect(result).toStrictEqual({min: 0.5, max: 0.7});
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

    it("it can formatOutput correctly", () => {
        expect(formatOutput(11111, '0,0', 1, 10)).toStrictEqual('11,110');
        expect(formatOutput(11111, '0,0', 10, 1)).toStrictEqual('111,110');
        expect(formatOutput(0.01, '0.00%', 1, null)).toStrictEqual('1.00%');
        expect(formatOutput('0.01', '0.00%', 10, null)).toStrictEqual('1.00%');
        expect(formatOutput('1', '', 1, 1)).toStrictEqual(1);
        expect(formatOutput(1, '', 1, 1)).toStrictEqual(1);
        expect(formatOutput(489.98, '', 1, 100)).toStrictEqual(489.98);
        expect(formatOutput(501.98, '', 1, 100)).toStrictEqual(500);
        expect(formatOutput(501.98, '', 1, 1000)).toStrictEqual(501.98);
        expect(formatOutput(5001.98, '', 1, 1000)).toStrictEqual(5000);
        expect(formatOutput(501.98, '', 1, 100, false)).toStrictEqual(501.98);
        expect(formatOutput(501.98, '', 1, 100, true)).toStrictEqual(500);
        expect(formatOutput(-11111, '0,0', 1, 1, false, false)).toStrictEqual('-11,111');
        expect(formatOutput(-11111, '0,0', 1, 1, false, true)).toStrictEqual('11,111');
    });

    it("it can formatLegend correctly", () => {
        expect(formatLegend(11111, '0,0', 1)).toStrictEqual('11k');
        expect(formatLegend(11111, '0,0', 10)).toStrictEqual('111k');
        expect(formatLegend(11111, '0,0', 0.1)).toStrictEqual('1.1k');
        expect(formatLegend(11111, '0,0', 100)).toStrictEqual('1.1m');
        expect(formatLegend(11111, '0,0', 1000)).toStrictEqual('11m');
        expect(formatLegend(0.01, '0.00%', 1)).toStrictEqual('1.00%');
        expect(formatLegend('0.01', '0.00%', 10)).toStrictEqual('1.00%');
        expect(formatLegend('1', '', 1)).toStrictEqual('1');
        expect(formatLegend(1, '', 1)).toStrictEqual('1');
    });

    it("getColourScaleLevels calculates 6 levels", () => {
        const metadata: IndicatorMetadata = {
            max: 2,
            min: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            name: "indicator",
            indicator: "prevalence",
            value_column: "mean",
            format: '',
            scale: 1,
            accuracy: null
        }
        const colourRange = {
            max: 2,
            min: 1
        };
        const levels = getColourScaleLevels(metadata, colourRange);

        expect(levels.length).toBe(6);
        expect(levels[0].label).toBe("2");
        expect(levels[0].style).toStrictEqual({background: "rgb(0, 0, 0)"});
        expect(levels[1].label).toBe("1.8");
        expect(levels[1].style).toStrictEqual({background: "rgb(64, 64, 64)"});
        expect(levels[2].label).toBe("1.6");
        expect(levels[2].style).toStrictEqual({background: "rgb(122, 122, 122)"});
        expect(levels[3].label).toBe("1.4");
        expect(levels[3].style).toStrictEqual({background: "rgb(180, 180, 180)"});
        expect(levels[4].label).toBe("1.2");
        expect(levels[4].style).toStrictEqual({background: "rgb(226, 226, 226)"});
        expect(levels[5].label).toBe("1");
        expect(levels[5].style).toStrictEqual({background: "rgb(255, 255, 255)"});
    });

    it("getColourScaleLevels calculates 6 levels from min to max with negative min", () => {
        const metadata: IndicatorMetadata = {
            max: 2,
            min: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            name: "indicator",
            indicator: "prevalence",
            value_column: "mean",
            format: '',
            scale: 1,
            accuracy: null
        }
        const colourRange = {
            max: 0,
            min: -0.45
        };
        const levels = getColourScaleLevels(metadata, colourRange);

        expect(levels.length).toBe(6);
        expect(levels[0].label).toBe("0");
        expect(levels[1].label).toBe("-0.09");
        expect(levels[2].label).toBe("-0.18");
        expect(levels[3].label).toBe("-0.27");
        expect(levels[4].label).toBe("-0.36");
        expect(levels[5].label).toBe("-0.45");
    });

    it("getColourScaleLevels calculates 6 levels from min to max with percentage format", () => {
        const metadata: IndicatorMetadata = {
            max: 2,
            min: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            name: "indicator",
            indicator: "prevalence",
            value_column: "mean",
            format: '0.00%',
            scale: 1,
            accuracy: null
        }
        const colourRange = {
            max: 2,
            min: 1
        };
        const levels = getColourScaleLevels(metadata, colourRange);

        expect(levels.length).toBe(6);
        expect(levels[0].label).toBe("200.00%");
        expect(levels[1].label).toBe("180.00%");
        expect(levels[2].label).toBe("160.00%");
        expect(levels[3].label).toBe("140.00%");
        expect(levels[4].label).toBe("120.00%");
        expect(levels[5].label).toBe("100.00%");
    });

    it("getColourScaleLevels calculates 6 levels from min to max with 500 scale", () => {
        const metadata: IndicatorMetadata = {
            max: 2,
            min: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            name: "indicator",
            indicator: "prevalence",
            value_column: "mean",
            format: '',
            scale: 500,
            accuracy: null
        }
        const colourRange = {
            max: 2,
            min: 1
        };
        const levels = getColourScaleLevels(metadata, colourRange);

        expect(levels.length).toBe(6);
        expect(levels[0].label).toBe("1.0k");
        expect(levels[1].label).toBe("900");
        expect(levels[2].label).toBe("800");
        expect(levels[3].label).toBe("700");
        expect(levels[4].label).toBe("600");
        expect(levels[5].label).toBe("500");
    });

    it("getColourScaleLevels returns single level when max equals min", () => {
        const metadata: IndicatorMetadata = {
            max: 2,
            min: 1,
            colour: "interpolateGreys",
            invert_scale: false,
            name: "indicator",
            indicator: "prevalence",
            value_column: "mean",
            format: '',
            scale: 1,
            accuracy: null
        }
        const colourRange = {
            max: 3,
            min: 3
        };
        const levels = getColourScaleLevels(metadata, colourRange);

        expect(levels.length).toBe(1);
        expect(levels[0].label).toBe("3");
        expect(levels[0].style).toStrictEqual({background: "rgb(255, 255, 255)"});
    });

    it("can return metadata for a specific indicator", () => {
        const indicators = [
            {
                indicator: "prevalence",
                value_column: "value",
                name: "Prevalence",
                min: 0,
                max: 0.5,
                colour: "blue",
                invert_scale: false,
                scale: 1,
                accuracy: null,
                format: "0.0%"
            },
            {
                indicator: "art_coverage",
                value_column: "value",
                name: "ART coverage",
                min: 0,
                max: 0.5,
                colour: "blue",
                invert_scale: false,
                scale: 1,
                accuracy: null,
                format: "0.0%"
            }
        ]
        const store = {
            state: mockRootState({
                modelCalibrate: mockModelCalibrateState({
                    metadata: mockCalibrateMetadataResponse({
                        indicators: indicators
                    })
                })
            })
        } as any as Store<RootState>
        const indicatorMetadata = getIndicatorMetadata(store, "choropleth", "prevalence");
        expect(indicatorMetadata).toStrictEqual(indicators[0])
    });

    it("can get visible features", () => {
        const features = [
            {
                properties: {
                    area_id: "MWI",
                    area_level: 1
                }
            },
            {
                properties: {
                    area_id: "MWI_1",
                    area_level: 2
                }
            },
            {
                properties: {
                    area_id: "MWI_1_1",
                    area_level: 3
                }
            }
        ] as any as Feature[];

        const selectedLevels = [
            {
                id: "1",
                label: "Country",
            },
            {
                id: "2",
                label: "Region",
            }]
        expect(getVisibleFeatures(features, selectedLevels)).toStrictEqual([features[0], features[1]])
    });
});
