import {IndicatorValuesDict, NumericRange} from "../../../../app/types";
import {getFeatureData} from "../../../../app/components/plots/choropleth/utils";
import {getColour} from "../../../../app/components/plots/utils";
import {mockIndicatorMetadata} from "../../../mocks";

describe("choropleth utils", () => {
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
                area_id: "MWI_1",
                indicator: "prevalence",
                mean: 0.3,
                upper: 0.35,
                lower: 0.25
            }
        ]
        const metadata = mockIndicatorMetadata({
            format: "0.00%"
        });
        const range: NumericRange = {
            min: 0,
            max: 1
        }
        const featureData = getFeatureData(
            data,
            metadata,
            range
        )

        const expectedData: IndicatorValuesDict = {
            MWI: {
                value: 0.25,
                lower_value: 0.20,
                upper_value: 0.30,
                color: getColour(0.25, metadata, range),
            },
            MWI_1: {
                value: 0.3,
                lower_value: 0.25,
                upper_value: 0.35,
                color: getColour(0.3, metadata, range),
            }
        };

        expect(featureData).toStrictEqual(expectedData);
    });
})
