import {getFeatureIndicators, getRadius} from "../../../../app/components/plots/bubble/utils";
import {getColor} from "../../../../app/components/plots/utils";
import {BubbleIndicatorValues} from "../../../../app/types";

describe("Bubble plot utils", () => {

    const plhiv = {
        indicator: "plhiv",
        value_column: "plhiv",
        name: "PLHIV",
        min: 0,
        max: 1,
        colour: "interpolateGreys",
        invert_scale: false,
        format: "0.00%",
        scale: 1,
        accuracy: null
    };
    const prev = {
        indicator: "prevalence",
        value_column: "prevalence",
        name: "Prevalence",
        min: 0,
        max: 1,
        colour: "interpolateGreys",
        invert_scale: false,
        format: "0.00%",
        scale: 1,
        accuracy: null
    };

    const selectedFeatureIds = ["MWI_1_1", "MWI_1_2"];

    const minRadius = 10;
    const maxRadius = 1000;

    const colourRange = {min: 0, max: 1};
    const sizeRange = {min: 1, max: 100};

    const expectedFeatureIndicators = {
        MWI_1_1: {
            sizeValue: 12,
            value: 0.5,
            color: getColor(0.5, prev, colourRange),
            radius: getRadius(12, 1, 100, minRadius, maxRadius)
        },
        MWI_1_2: {
            sizeValue: 14,
            radius: getRadius(14, 1, 100, minRadius, maxRadius),
            value: 0.6,
            color: getColor(0.6, prev, colourRange)
        }
    };

    it("can get feature indicators from wide format data", () => {
        const data = [
            {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 12},
            {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 14},
            {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 16} //should not be included, not in selectedFeatures
        ];

        const result = getFeatureIndicators(data, selectedFeatureIds, plhiv, prev, sizeRange, colourRange,
            [], {}, minRadius, maxRadius);
        expect(result).toStrictEqual(expectedFeatureIndicators);
    });

    it("can get feature indicators from long format data", () => {
        const plhivLong = {
            indicator: "plhiv", value_column: "value", indicator_column: "indicator", indicator_value: "plhiv",
            name: "PLHIV", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false,
            format: "0.00%",
            scale: 1,
            accuracy: null
        };
        const prevLong = {
            indicator: "prevalence", value_column: "value", indicator_column: "indicator", indicator_value: "prev",
            name: "Prevalence", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false,
            format: "0.00%",
            scale: 1,
            accuracy: null
        };

        const data = [
            {area_id: "MWI_1_1", indicator: "plhiv", value: 12},
            {area_id: "MWI_1_1", indicator: "prev", value: 0.5},
            {area_id: "MWI_1_2", indicator: "plhiv", value: 14},
            {area_id: "MWI_1_2", indicator: "prev", value: 0.6},
            {area_id: "MWI_1_3", indicator: "plhiv", value: 14} //should not be included, not in selectedFeatures
        ];

        const result = getFeatureIndicators(data, selectedFeatureIds, plhivLong, prevLong, sizeRange, colourRange,
            [], {}, minRadius, maxRadius);
        expect(result).toStrictEqual(expectedFeatureIndicators);
    });

    it("can exclude rows based on filters", () => {
        const filters = [
            {
                id: "age",
                label: "Age",
                column_id: "age",
                options: [{id: "0:15", label: "0-15"}, {id: "15:30", label: "15-30"}]
            },
            {
                id: "sex",
                label: "Sex",
                column_id: "sex",
                options: [{id: "female", label: "F"}, {id: "male", label: "M"}]
            },
            {id: "survey", label: "Survey", column_id: "survey_id", options: []}//should not exclude for filters with no options
        ];

        const selectedFilterValues = {
            age: [{id: "0:15", label: "0-15"}, {id: "15:30", label: "15-30"}],
            sex: [{id: "female", label: "Female"}]
        };

        const data = [
            {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 12, sex: "female", age: "0:15"},
            {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 14, sex: "female", age: "15:30"},
            {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 16, sex: "female", age: "0:15"}, //not included: not in selectedFeatures
            {area_id: "MWI_1_1", prevalence: 0.1, plhiv: 18, sex: "male", age: "0:15"}, //not included: no sex filter match
            {area_id: "MWI_1_1", prevalence: 0.2, plhiv: 20, sex: "female", age: "30:45"}, //not included: no age filter match
        ];

        const result = getFeatureIndicators(data, selectedFeatureIds, plhiv, prev, sizeRange, colourRange, filters,
            selectedFilterValues, minRadius, maxRadius);

        expect(result).toStrictEqual(expectedFeatureIndicators);
    });

    it("can get feature indicators from partial rows", () => {
        const partialData = [
            {area_id: "MWI_1_1", prevalence: 0.5},
            {area_id: "MWI_1_2", plhiv: 14},
        ];
        const result = getFeatureIndicators(partialData, selectedFeatureIds, plhiv, prev, sizeRange, colourRange,
            [], {},
            minRadius, maxRadius);

        expect(result).toStrictEqual({
            MWI_1_1: {
                value: 0.5,
                color: getColor(0.5, prev, colourRange)

            },
            MWI_1_2: {
                radius: getRadius(14, 1, 100, minRadius, maxRadius),
                sizeValue: 14
            }
        });
    });

    const radiusToArea = (r: number) => {
        return Math.PI * r * r
    };
    const areaToRadius = (x: number) => {
        return Math.sqrt(x / Math.PI)
    };
    const minArea = radiusToArea(5);
    const maxArea = radiusToArea(10);
    it("can get radius", () => {
        expect(getRadius(1, 1, 10, 5, 10)).toBe(5);
        expect(getRadius(10, 1, 10, 5, 10)).toBe(10);

        const expectedArea = minArea + ((4 / 9) * (maxArea - minArea));
        const expectedRadius = areaToRadius(expectedArea);
        expect(getRadius(5, 1, 10, 5, 10)).toBeCloseTo(expectedRadius, 5);
    });

    it("can get radius where min value is 0", () => {
        expect(getRadius(0, 0, 10, 5, 10)).toBe(5);
        expect(getRadius(10, 0, 10, 5, 10)).toBe(10);

        const expectedArea = minArea + (0.5 * (maxArea - minArea));
        const expectedRadius = areaToRadius(expectedArea);
        expect(getRadius(5, 0, 10, 5, 10)).toBeCloseTo(expectedRadius, 5);
    });

    it("can get radius where min area is 0", () => {
        expect(getRadius(0, 0, 10, 0, 10)).toBe(0);
        expect(getRadius(10, 0, 10, 0, 10)).toBe(10);

        const expectedArea = 0.5 * maxArea;
        const expectedRadius = areaToRadius(expectedArea);
        expect(getRadius(5, 0, 10, 0, 10)).toBeCloseTo(expectedRadius, 5);
    });

    it("can get radius where value is greater than max", () => {
        expect(getRadius(20, 0, 10, 5, 50)).toBe(50);
    });

    it("can get radius where value is less than min", () => {
        expect(getRadius(1, 2, 10, 5, 50)).toBe(5);
    });

    it("can compute prevalence and plhiv uncertainty ranges ", () => {
        const partialData = [
            {area_id: "MWI_1_1", prevalence: 0.5, lower: 0.01, upper: 0.10},
            {area_id: "MWI_1_2", plhiv: 14, lower: 0.10, upper: 0.19},
        ];
        const result = getFeatureIndicators(partialData, selectedFeatureIds, plhiv, prev, sizeRange, colourRange,
            [], {},
            minRadius, maxRadius);

        expect(result).toStrictEqual({
            MWI_1_1: {
                value: 0.5,
                color: getColor(0.5, prev, colourRange),
                lower_value: 0.01,
                upper_value: 0.10

            },
            MWI_1_2: {
                radius: getRadius(14, 1, 100, minRadius, maxRadius),
                sizeValue: 14,
                sizeLower: 0.10,
                sizeUpper: 0.19
            }
        });
    });

    it("it compute prevalence and plhiv uncertainty where ranges are zeros", () => {
        const partialData = [
            {area_id: "MWI_1_1", prevalence: 0.5, lower: 0, upper: 0},
            {area_id: "MWI_1_2", plhiv: 14, lower: 0, upper: 0},
        ];
        const result = getFeatureIndicators(partialData, selectedFeatureIds, plhiv, prev, sizeRange, colourRange,
            [], {},
            minRadius, maxRadius);

        expect(result).toStrictEqual({
            MWI_1_1: {
                value: 0.5,
                color: getColor(0.5, prev, colourRange),
                lower_value: 0,
                upper_value: 0
            },
            MWI_1_2: {
                radius: getRadius(14, 1, 100, minRadius, maxRadius),
                sizeValue: 14,
                sizeLower: 0,
                sizeUpper: 0
            }
        });
    });

});
