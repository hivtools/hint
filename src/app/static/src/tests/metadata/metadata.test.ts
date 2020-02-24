import {metadataGetters} from "../../app/store/metadata/metadata"
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {
    mockMetadataState,
    mockPlottingMetadataResponse,
    mockRootState,
    mockSurveyAndProgramState
} from "../mocks";

const testIndicators = [
    {indicator: "art_coverage", name: "ART Coverage"},
    {indicator:"prevalence", name: "Prevalence"}
];

const testChoroMetadata = {
    choropleth: {
        indicators: testIndicators
    }
} as any;

function testGetsChoroplethIndicatorsMetadataForDataType(dataType: DataType) {
    let metadataProps = null as any;
    switch(dataType) {
        case(DataType.ANC):
            metadataProps = {anc: testChoroMetadata};
            break;
        case(DataType.Survey):
            metadataProps = {survey: testChoroMetadata};
            break;
        case(DataType.Program):
            metadataProps = {programme: testChoroMetadata};
            break;
    }

    const metadataState =  mockMetadataState(
        {plottingMetadata: mockPlottingMetadataResponse(metadataProps)});

    const rootState = mockRootState({surveyAndProgram: mockSurveyAndProgramState({selectedDataType: dataType})});

    const result = metadataGetters.choroplethIndicatorsMetadata(metadataState, null, rootState, null);

    expect(result).toStrictEqual(testIndicators);
}

describe("Metadata regionIndicator getter", () => {

    it("gets choropleth indicators metadata for anc", () => {
        testGetsChoroplethIndicatorsMetadataForDataType(DataType.ANC);
    });

    it("gets choropleth indicators metadata for programme", () => {
        testGetsChoroplethIndicatorsMetadataForDataType(DataType.Program);
    });

    it("gets choropleth indicators metadata for survey", () => {
        testGetsChoroplethIndicatorsMetadataForDataType(DataType.Survey);
    });

    it ("gets empty choropleth indicators when there is no metadata", () => {
        const metadataState =  mockMetadataState(
            {plottingMetadata: null});

        const result = metadataGetters.choroplethIndicatorsMetadata(metadataState, null, mockRootState(), null);

        expect(result).toEqual([]);
    });

    it("gets choropleth indicators", () => {

        const rootState = mockRootState({surveyAndProgram: mockSurveyAndProgramState({selectedDataType: DataType.ANC})});

        const testMetadata = {
            anc: testChoroMetadata,
            survey: {},
            programme: {},
            output: {},
        };

        const result = metadataGetters.choroplethIndicatorsMetadata(mockMetadataState(
            {plottingMetadata: testMetadata}
        ), null, rootState, null);

        expect(result).toStrictEqual(testIndicators);
    });
});