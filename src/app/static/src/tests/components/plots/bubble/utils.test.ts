import {getFeatureData, getRadius, tooltipContent} from "../../../../app/components/plots/bubble/utils";
import {Feature} from "geojson";
import {mockIndicatorMetadata} from "../../../mocks";
import {BubbleIndicatorValuesDict, NumericRange} from "../../../../app/types";
import {getColour} from "../../../../app/components/plots/utils";

describe("Bubble plot utils", () => {
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

    const feature = {
        properties: {
            area_id: "MWI",
            area_name: "Malawi"
        }
    } as any as Feature;
    const colourIndicator = mockIndicatorMetadata({
        format: "0.00%"
    });

    const sizeIndicator = mockIndicatorMetadata({
        indicator: "plhiv",
        indicator_value: "plhiv",
        name: "PLHIV",
        format: "0"
    });

    it("builds expected tooltip content", () => {
        const featureData: BubbleIndicatorValuesDict = {
            MWI: {
                value: 0.1,
                color: "#ff7f00",
                lower_value: 0.09,
                upper_value: 0.11,
                radius: 2.0,
                sizeValue: 10.1,
                sizeLower: 9.2,
                sizeUpper: 11.2,
            }
        };

        const tooltip = tooltipContent(feature, featureData, colourIndicator, sizeIndicator);
        expect(tooltip).toEqual(`<div>
                    <strong>Malawi</strong>
                    <br/>Prevalence: 10.00%
                    <br/>(9.00% - 11.00%)
                    <br/>
                    <br/>PLHIV: 10
                    <br/>(9 - 11)
                </div>`);
    });

    it("builds expected tooltip content when ranges are missing", () => {
        const featureData: BubbleIndicatorValuesDict = {
            MWI: {
                value: 0.1,
                color: "#ff7f00",
                radius: 2.0,
                sizeValue: 10.1,
            }
        };

        const tooltip = tooltipContent(feature, featureData, colourIndicator, sizeIndicator);
        expect(tooltip).toEqual(`<div>
                <strong>Malawi</strong>
                <br/>Prevalence: 10.00%
                <br/>PLHIV: 10
            </div>`);
    });

    it("builds feature data correctly", () => {
        const data = [
            {
                area_id: "MWI",
                indicator: "prevalence",
                mean: 0.25,
                upper: 0.30,
                lower: 0.20
            },
            {
                area_id: "MWI",
                indicator: "plhiv",
                mean: 200,
                upper: 240,
                lower: 180
            }
        ]
        const sizeRange: NumericRange = {
            min: 0,
            max: 3
        }
        const colourRange: NumericRange = {
            min: 0,
            max: 3
        }
        const featureData = getFeatureData(
            data,
            sizeIndicator,
            colourIndicator,
            sizeRange,
            colourRange,
            0.5,
            2.5
        )

        const expectedData: BubbleIndicatorValuesDict = {
            MWI: {
                value: 0.25,
                lower_value: 0.20,
                upper_value: 0.30,
                color: getColour(0.25, colourIndicator, colourRange),
                radius: getRadius(240, sizeRange.min, sizeRange.max, 0.5, 2.5),
                sizeValue: 200,
                sizeLower: 180,
                sizeUpper: 240,
            }
        };

        expect(featureData).toStrictEqual(expectedData);
    });
});
