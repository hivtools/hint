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
    {indicator: "prevalence", name: "Prevalence"}
];

const testChoroMetadata = {
    choropleth: {
        indicators: testIndicators
    }
} as any;

function testGetsSAPIndicatorsMetadataForDataType(dataType: DataType) {
    let metadataProps = null as any;
    switch (dataType) {
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

    const metadataState = mockMetadataState(
        {plottingMetadata: mockPlottingMetadataResponse(metadataProps)});

    const rootState = mockRootState({surveyAndProgram: mockSurveyAndProgramState({selectedDataType: dataType})});

    const result = metadataGetters.sapIndicatorsMetadata(metadataState, null, rootState, null);

    expect(result).toStrictEqual(testIndicators);
}

describe("Metadata ", () => {

    it("gets SAP indicators metadata for anc", () => {
        testGetsSAPIndicatorsMetadataForDataType(DataType.ANC);
    });

    it("gets SAP indicators metadata for programme", () => {
        testGetsSAPIndicatorsMetadataForDataType(DataType.Program);
    });

    it("gets SAP indicators metadata for survey", () => {
        testGetsSAPIndicatorsMetadataForDataType(DataType.Survey);
    });

    it("gets empty SAP indicators when there is no metadata", () => {
        const metadataState = mockMetadataState(
            {plottingMetadata: null});

        const result = metadataGetters.sapIndicatorsMetadata(metadataState, null, mockRootState(), null);

        expect(result).toEqual([]);
    });

    it("gets SAP choropleth indicators", () => {

        const rootState = mockRootState({surveyAndProgram: mockSurveyAndProgramState({selectedDataType: DataType.ANC})});

        const testMetadata = {
            anc: testChoroMetadata,
            survey: {},
            programme: {},
            output: {},
        };

        const result = metadataGetters.sapIndicatorsMetadata(mockMetadataState(
            {plottingMetadata: testMetadata}
        ), null, rootState, null);

        expect(result).toStrictEqual(testIndicators);
    });

});