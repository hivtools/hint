import {
    getFeatureIndicators,
    getIndicatorRanges,
    getRadius,
    toIndicatorNameLookup
} from "../../../../app/components/plots/bubble/utils";
import {getColor} from "../../../../app/store/filteredData/utils";

describe("Bubble plot utils", () => {

    const indicators = [
        {
            indicator: "plhiv", value_column: "plhiv", name: "PLHIV", min: 0, max:0, colour: "interpolateGreys", invert_scale: false
        },
        {
            indicator: "prevalence", value_column: "prevalence", name: "Prevalence", min: 0, max: 0, colour: "interpolateGreys", invert_scale: false
        }
    ];

    const indicatorRanges = {
        plhiv: {min: 1, max: 100},
        prevalence: {min: 0, max: 0.8}
    };

    const selectedFeatures = [
        {properties: {area_id: "MWI_1_1"}},
        {properties: {area_id: "MWI_1_2"}}
    ];

    const minRadius = 10;
    const maxRadius = 1000;
    //const minArea = Math.PI * (minRadius * minRadius);
    //const maxArea = Math.PI * (maxRadius * maxRadius);

    const expectedFeatureIndicators = {
        MWI_1_1: {
            plhiv: {
                value: 12,
                color: getColor(12, indicators[0]),
                radius: getRadius(12, 1, 100, minRadius, maxRadius)
            },
            prevalence: {
                value: 0.5,
                color: getColor(0.5, indicators[1]),
                radius: getRadius(0.5, 0, 0.8, minRadius, maxRadius)
            }
        },
        MWI_1_2: {
            plhiv: {
                value: 14,
                color: getColor(14, indicators[0]),
                radius: getRadius(14, 1, 100, minRadius, maxRadius)
            },
            prevalence: {
                value: 0.6,
                color: getColor(0.6, indicators[1]),
                radius: getRadius(0.6, 0, 0.8, minRadius, maxRadius)
            }
        }
    };

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

    it("can get feature indicators from wide format data", () => {
        const data = [
            {area_id: "MWI_1_1", prevalence: 0.5, plhiv: 12},
            {area_id: "MWI_1_2", prevalence: 0.6, plhiv: 14},
            {area_id: "MWI_1_3", prevalence: 0.7, plhiv: 16} //should not be included, not in selectedFeatures
        ];

        const result = getFeatureIndicators(data, selectedFeatures as any, indicators, indicatorRanges, minRadius, maxRadius);

        expect(result).toStrictEqual(expectedFeatureIndicators);
    });

    it("can get feature indicators from long format data", () => {
        const longIndicators = [
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
            {area_id: "MWI_1_1", indicator: "plhiv", value: 12},
            {area_id: "MWI_1_1", indicator: "prev", value: 0.5},
            {area_id: "MWI_1_2", indicator: "plhiv", value: 14},
            {area_id: "MWI_1_2", indicator: "prev", value: 0.6},
            {area_id: "MWI_1_3", indicator: "plhiv", value: 14} //should not be included, not in selectedFeatures
        ];

        const result = getFeatureIndicators(data, selectedFeatures as any, longIndicators, indicatorRanges, minRadius, maxRadius);

        expect(result).toStrictEqual(expectedFeatureIndicators);
    });

    it("can get feature indicators from partial rows", () => {
        const partialData = [
            {area_id: "MWI_1_1", prevalence: 0.5},
            {area_id: "MWI_1_2", plhiv: 14},
        ];

        const result = getFeatureIndicators(partialData, selectedFeatures as any, indicators, indicatorRanges, minRadius, maxRadius);

        expect(result).toStrictEqual({
            MWI_1_1: {
                prevalence: {
                    value: 0.5,
                    color: getColor(0.5, indicators[1]),
                    radius: getRadius(0.5, 0, 0.8, minRadius, maxRadius)
                }
            },
            MWI_1_2: {
                plhiv: {
                    value: 14,
                    color: getColor(14, indicators[0]),
                    radius: getRadius(14, 1, 100, minRadius, maxRadius)
                }
            }
        });
    });

    it("can get indicator name lookup", () => {
        expect(toIndicatorNameLookup(indicators)).toStrictEqual({
            plhiv: "PLHIV",
            prevalence: "Prevalence"
        });
    });


    const radiusToArea = (r: number) => {return Math.PI * r *r};
    const areaToRadius = (x: number) => {return Math.sqrt(x/Math.PI)};
    const minArea = radiusToArea(5);
    const maxArea = radiusToArea(10);
    it ("can get radius", () => {
        expect(getRadius(1, 1, 10, 5, 10)).toBe(5);
        expect(getRadius(10, 1, 10, 5, 10)).toBe(10);

        const expectedArea = minArea + ((4/9) * (maxArea - minArea));
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

    it ("can get radius where min area is 0", () => {
        expect(getRadius(0, 0, 10, 0, 10)).toBe(0);
        expect(getRadius(10, 0, 10, 0, 10)).toBe(10);

        const expectedArea = 0.5 * maxArea;
        const expectedRadius = areaToRadius(expectedArea);
        expect(getRadius(5, 0, 10, 0, 10)).toBeCloseTo(expectedRadius, 5);
    });

});