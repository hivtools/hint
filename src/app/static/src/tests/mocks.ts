import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import {BaselineState, initialBaselineState} from "../app/store/baseline/baseline";
import {initialPasswordState, PasswordState} from "../app/store/password/password";
import {initialSurveyAndProgramState, SurveyAndProgramState} from "../app/store/surveyAndProgram/surveyAndProgram"

import {
    AncResponse,
    CalibrateDataResponse,
    CalibrateMetadataResponse,
    CalibratePlotResponse,
    IndicatorMetadata,
    ComparisonPlotResponse,
    DownloadSubmitRequest,
    Error,
    ModelResultResponse,
    ModelStatusResponse,
    PjnzResponse,
    PopulationResponse,
    ProgrammeResponse,
    Response,
    ReviewInputFilterMetadataResponse,
    ShapeResponse,
    SurveyResponse,
    ValidateBaselineResponse,
    VmmcResponse,
    Warning,
    InputComparisonMetadata,
    InputComparisonData,
    PopulationResponseData,
    InputPopulationMetadataResponse
} from "../app/generated";
import {initialModelRunState, ModelRunState} from "../app/store/modelRun/modelRun";
import {emptyState, RootState} from "../app/root";
import {initialStepperState, StepperState} from "../app/store/stepper/stepper";
import {initialMetadataState, MetadataState, PlotMetadataFrame} from "../app/store/metadata/metadata";
import {initialLoadState, LoadState} from "../app/store/load/state";
import {initialModelOptionsState, ModelOptionsState} from "../app/store/modelOptions/modelOptions";
import {initialModelOutputState, ModelOutputState} from "../app/store/modelOutput/modelOutput";
import {ErrorsState, initialErrorsState} from "../app/store/errors/errors";
import {
    Dataset,
    DatasetResource,
    DownloadIndicatorDataset,
    DownloadResultsDependency,
    ReviewInputDataset,
    Release
} from "../app/types";
import {initialProjectsState, ProjectsState} from "../app/store/projects/projects";
import {initialModelCalibrateState, ModelCalibrateState} from "../app/store/modelCalibrate/modelCalibrate";
import { HintrVersionState, initialHintrVersionState } from "../app/store/hintrVersion/hintrVersion";
import {ADRDatasetState, ADRState, initialADRState} from "../app/store/adr/adr";
import {ADRUploadState, initialADRUploadState} from "../app/store/adrUpload/adrUpload";
import {DownloadResultsState, initialDownloadResultsState} from "../app/store/downloadResults/downloadResults";
import {ReviewInputState, initialReviewInputState} from "../app/store/reviewInput/reviewInput";
import {DynamicControlType, DynamicFormMeta} from "@reside-ic/vue-next-dynamic-form";
import {
    ControlSelection,
    FilterSelection,
    initialPlotSelectionsState,
    PlotSelectionsState
} from "../app/store/plotSelections/plotSelections";
import {PlotDataState, initialPlotDataState, PopulationPyramidData} from "../app/store/plotData/plotData";
import { PlotState, initialPlotState } from "../app/store/plotState/plotState";

export const mockAxios = new MockAdapter(axios);

export const mockPasswordState = (props?: Partial<PasswordState>): PasswordState => {
    return {
        ...initialPasswordState,
        ...props
    }
};

export const mockADRState = (props?: Partial<ADRState>): ADRState => {
    return {
        ...initialADRState(),
        ...props
    }
};

export const mockADRDatasetState = (props?: Partial<ADRDatasetState>): ADRDatasetState => {
    return {
        datasets: ["TEST DATASETS"],
        releases: ["TEST RELEASES"],
        fetchingDatasets: false,
        fetchingError: null,
        ...props
    }
};

export const mockADRDataState = (props?: Partial<ADRState["adrData"]>): ADRState["adrData"] => {
    return {
        input: mockADRDatasetState(),
        output: mockADRDatasetState(),
        ...props
    }
};

export const mockADRUploadState =  (props?: Partial<ADRUploadState>): ADRUploadState => {
    return {
        ...initialADRUploadState(),
        ...props
    }
};

export const mockDownloadResultsState =  (props?: Partial<DownloadResultsState>): DownloadResultsState => {
    return {
        ...initialDownloadResultsState(),
        ...props
    }
};

export const mockBaselineState = (props?: Partial<BaselineState>): BaselineState => {
    return {
        ...initialBaselineState(),
        ...props
    }
};

export const mockSurveyAndProgramState = (props?: Partial<SurveyAndProgramState>): SurveyAndProgramState => {
    return {
        ...initialSurveyAndProgramState(),
        ...props
    }
};

export const mockModelRunState = (props?: Partial<ModelRunState>) => {
    return {
        ...initialModelRunState(),
        ...props
    }
};

export const mockHintrVersionState = (props?: Partial<HintrVersionState>): HintrVersionState  => {
    return {
        ...initialHintrVersionState(),
        ...props
    }
};


export const mockModelOptionsState = (props?: Partial<ModelOptionsState>): ModelOptionsState => {
    return {
        ...initialModelOptionsState(),
        ...props
    }
};

export const mockModelCalibrateState = (props?: Partial<ModelCalibrateState>): ModelCalibrateState => {
    return {
        ...initialModelCalibrateState(),
        ...props
    }
};

export const mockStepperState = (props?: Partial<StepperState>): StepperState => {
    return {
        ...initialStepperState(),
        ...props
    }
};

export const mockErrorsState = (props?: Partial<ErrorsState>): ErrorsState => {
    return {
        ...initialErrorsState(),
        ...props
    }
};

export const mockMetadataState = (props?: Partial<MetadataState>): MetadataState => {
    return {
        ...initialMetadataState(),
        ...props
    }
};

export const mockLoadState = (props?: Partial<LoadState>): LoadState => {
    return {
        ...initialLoadState(),
        ...props
    }
};

export const mockModelOutputState = (props?: Partial<ModelOutputState>): ModelOutputState => {
    return {
        ...initialModelOutputState(),
        ...props
    }
}

export const mockPlotDataState = (props?: Partial<PlotDataState>) => {
    return {
        ...initialPlotDataState(),
        ...props
    }
};


export const mockIndicatorMetadata = (props?: Partial<IndicatorMetadata>): IndicatorMetadata => {
    return {
        indicator: "prevalence",
        value_column: "mean",
        indicator_column: "indicator",
        indicator_value: "prevalence",
        name: "Prevalence",
        error_low_column: "lower",
        error_high_column: "upper",
        min: 0,
        max: 1,
        colour: "interpolateReds",
        invert_scale: false,
        format: "0.00",
        scale: 1,
        accuracy: null,
        ...props
    };
};

export const mockPlotSelections = (props?: Partial<PlotSelectionsState>) => {
    return {
        ...initialPlotSelectionsState(),
        ...props
    }
};

export const mockPlotState = (props?: Partial<PlotState>) => {
    return {
        ...initialPlotState(),
        ...props
    }
};

export const mockPlotSelectionsState = (props?: Partial<PlotSelectionsState>): PlotSelectionsState => {
    return {
        ...initialPlotSelectionsState(),
        ...props
    }
};

export const mockFilterSelection = (props?: Partial<FilterSelection>): FilterSelection => {
    return {
        filterId: "detail",
        stateFilterId: "detailFilter",
        label: "Detail filter",
        selection: [
            {
                label: "Option A",
                id: "detailOptA"
            },
            {
                label: "Option B",
                id: "detailOptB"
            }
        ],
        multiple: true,
        hidden: false,
        ...props
    }
}

export const mockControlSelection = (props?: Partial<ControlSelection>): ControlSelection => {
    return {
        id: "controlId",
        label: "Plot control",
        selection: [
            {
                label: "Option A",
                id: "detailOptA"
            },
            {
                label: "Option A",
                id: "detailOptB"
            }
        ],
        ...props
    }
}

export const mockProjectsState = (props?: Partial<ProjectsState>) => {
    return {
        ...initialProjectsState(),
        ...props
    }
};

export const mockReviewInputState =  (props?: Partial<ReviewInputState>): ReviewInputState => {
    return {
        ...initialReviewInputState(),
        ...props
    }
};

export const mockInputComparisonState = (props?: Partial<ReviewInputState["inputComparison"]>): ReviewInputState["inputComparison"] => {
    return {
        loading: false,
        error: null,
        data: null,
        dataSource: null,
        ...props
    }
}

export const mockInputComparisonData = (props?: Partial<InputComparisonData>): InputComparisonData => {
    return {
        anc: [
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2020,
                group: "Adult Males",
                value_spectrum: 2001,
                value_naomi: 3000
            },
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2021,
                group: "Adult Males",
                value_spectrum: null,
                value_naomi: 2000
            },
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2022,
                group: "Adult Females",
                value_spectrum: 5001,
                value_naomi: 2000
            },
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2023,
                group: "Adult Females",
                value_spectrum: 6000,
                value_naomi: 6000
            }
        ],
        art: [
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2020,
                group: "Adult Males",
                value_spectrum_adjusted: 2001,
                value_spectrum_reported: 2002,
                value_spectrum_reallocated: 0,
                value_naomi: 3000,
                difference: 1,
                difference_ratio: 0
            },
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2021,
                group: "Adult Males",
                value_spectrum_adjusted: null,
                value_spectrum_reported: null,
                value_spectrum_reallocated: null,
                value_naomi: 2000,
                difference: null,
                difference_ratio: null
            },
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2022,
                group: "Adult Females",
                value_spectrum_adjusted: 5001,
                value_spectrum_reported: 5002,
                value_spectrum_reallocated: 0,
                value_naomi: 2000,
                difference: 1,
                difference_ratio: 0
            },
            {
                indicator: "prevalence",
                area_name: "Malawi",
                year: 2023,
                group: "Adult Females",
                value_spectrum_adjusted: 6000,
                value_spectrum_reported: 6001,
                value_spectrum_reallocated: 0,
                value_naomi: 6000,
                difference: 1,
                difference_ratio: 0
            }
        ]
    }
}

export const mockReviewInputDataset = (props?: Partial<ReviewInputDataset>): ReviewInputDataset => {
    return {
        data: [],
        metadata: {
            columns: [],
            defaults: {
                selected_filter_options: {}
            }
        },
        warnings: [mockWarning()],
        ...props
    }
}

export const mockRootState = (props?: Partial<RootState>): RootState => {
    return {
        ...emptyState(),
        ...props
    }
};

export const mockFile = (filename: string, fileContents: string, type: string = "text/csv"): File => {
    return new File([fileContents], filename, {
        type: type,
        lastModified: 1
    });
};

export const mockSuccess = (data: any, version?: any): Response => {
    return {
        data,
        status: "success",
        errors: [],
        version
    }
};

const mockDownloadErrorResponse = () => {
    const errorResponse = [
        {
            error: "FAILED_TO_RETRIEVE_RESULT",
            detail: "Missing some results",
            key: "rofah-volil-kivup"
        }
    ]
    const str = JSON.stringify(errorResponse);
    return new Blob([str], {
        type: "application/json"
    });
}

export const mockDownloadFailure = (errorMessage = mockDownloadErrorResponse) => {
    return errorMessage
};

export const mockFailure = (errorMessage: string): Response => {
    return {
        data: {},
        status: "failure",
        errors: [mockError(errorMessage)]
    }
};

export const mockError = (errorMessage: string = "some message"): Error => {
    return {error: "OTHER_ERROR", detail: errorMessage};
};

export const mockPJNZResponse = (props: Partial<PjnzResponse> = {}): PjnzResponse => {
    return {
        data: {country: "Malawi", iso3: "MWI"},
        hash: "1234.csv",
        filename: "test.pjnz",
        type: "pjnz",
        ...props
    }
};

export const mockShapeResponse = (props: Partial<ShapeResponse> = {}): ShapeResponse => {
    return {
        data: {
            "type": "FeatureCollection",
            "features": []
        },
        type: "shape",
        hash: "1234.csv",
        filename: "test.csv",
        filters: {
            level_labels: [{id: 1, area_level_label: "Country", display: true}],
            regions: {label: "Malawi", id: "1", children: []}
        },
        ...props
    }
};

export const mockSurveyResponse = (props: Partial<SurveyResponse> = {}): SurveyResponse => {
    return {
        type: "survey",
        filename: "test.csv",
        hash: "1234.csv",
        data: [],
        filters: null,
        warnings: [],
        ...props
    }
};

export const mockSurveyData = (props?: Partial<SurveyResponse["data"][0]>): SurveyResponse["data"][0] => {
    return {
        indicator: "prevalence",
        survey_id: "survey1",
        survey_year: 2000,
        area_id: "MWI",
        sex: "Both",
        age_group: "Y15-49",
        n_clusters: 10,
        n_observations: 100,
        estimate: 0.2,
        std_error: 0.02,
        ci_lower: 0.18,
        ci_upper: 0.20,
        ...props
    };
};

export const mockProgramResponse = (props: Partial<ProgrammeResponse> = {}): ProgrammeResponse => {
    return {
        type: "programme",
        filename: "test.csv",
        data: [],
        hash: "1234.csv",
        filters: null,
        warnings: [],
        ...props
    }
};

export const mockProgramData = (props?: Partial<ProgrammeResponse["data"][0]>): ProgrammeResponse["data"][0] => {
    return {
        area_id: "MWI",
        calendar_quarter: "Y2000Q3",
        sex: "both",
        age_group: "Y015-049",
        art_current: 300,
        ...props
    }
};

export const mockAncResponse = (props: Partial<AncResponse> = {}): AncResponse => {
    return {
        type: "anc",
        filename: "test.csv",
        hash: "1234.csv",
        data: [],
        filters: null,
        warnings: [],
        ...props
    }
};

export const mockAncData = (props?: Partial<AncResponse["data"][0]>): AncResponse["data"][0] => {
    return {
        area_id: "MWI",
        age_group: "Y015-049",
        year: 2000,
        anc_clients: 300,
        anc_hiv_status: 300,
        anc_known_pos: 300,
        anc_already_art: 300,
        anc_tested: 300,
        anc_tested_pos: 300,
        anc_prevalence: 300,
        anc_art_coverage: 300,
        ...props
    }
}

export const mockVmmcResponse = (props: Partial<VmmcResponse> = {}): VmmcResponse => {
    return {
        type: "vmmc",
        filename: "test.xlsx",
        hash: "1234.xlsx",
        data: null,
        filters: null,
        warnings: [],
        ...props
    }
};

export const mockPopulationResponse = (props: Partial<PopulationResponse> = {}): PopulationResponse => {
    return {
        data: [],
        type: "population",
        hash: "1234.csv",
        filename: "test.csv",
        ...props
    }
};

export const mockInputPopulationMetadataResponse = (props: Partial<InputPopulationMetadataResponse> = {}): InputPopulationMetadataResponse => {
    return {
        filterTypes: [],
        indicators: [],
        plotSettingsControl: {
            population: {
                plotSettings: []
            },
        }
    }
}

export const mockValidateBaselineResponse = (props: Partial<ValidateBaselineResponse> = {}): ValidateBaselineResponse => {
    return {
        consistent: true,
        ...props
    }
};

export const mockModelStatusResponse = (props: Partial<ModelStatusResponse> = {}): ModelStatusResponse => {
    return {
        done: true,
        success: true,
        progress: [],
        queue: 1,
        id: "1234",
        status: "finished",
        ...props
    }
};

export const mockModelResultResponse = (props: Partial<ModelResultResponse> = {}): ModelResultResponse => {
    return {
        id: "123",
        complete: true,
        warnings: [],
        ...props
    };
};

export const mockPopulationDataResponse = (): PopulationResponseData => {
    return [{
        area_id:"MWI_4_10_demo",
        calendar_quarter:"CY2008Q2",
        sex:"female",
        age_group:"Y000_004",
        population: 21299
    }]
}

export const mockPopulationPyramidData = (): PopulationPyramidData => {
    return {
        data: [{
            area_id: "MWI_4_10_demo",
            area_name: "Ntchisi",
            calendar_quarter: "CY2008Q2",
            sex: "female",
            age_group: "Y000_004",
            population: 21299
        }],
        nationalLevelData: [{
            area_id: "MWI",
            area_name: "Malawi",
            calendar_quarter: "CY2008Q2",
            sex: "female",
            age_group: "Y000_004",
            population: 21299
        }]
    }
}

export const mockCalibrateDataResponse = (): CalibrateDataResponse["data"] => {
    return [{
        area_id: "MWI",
        sex: "both",
        age_group: "1",
        calendar_quarter: "1",
        indicator_id: 1,
        indicator: 'mock',
        lower: 0.5,
        mean: 0.5,
        mode: 0.5,
        upper: 0.5
    }]
}

export const mockCalibratePlotResponse = (props: Partial<CalibratePlotResponse> = {}): CalibratePlotResponse => {
    return {
        data: [],
        metadata: {
            filterTypes: [],
            indicators: [],
            plotSettingsControl: {
                calibrate: {
                    plotSettings: [
                        {
                            id: "1",
                            label: "setting",
                            options: []
                        }
                    ]
                }
            }
        },
        ...props
    }
}

export const mockCalibrateMetadataResponse = (props: Partial<CalibrateMetadataResponse> = {}): CalibrateMetadataResponse => {
    return {
        filterTypes: [],
        indicators: [],
        plotSettingsControl: {
            choropleth: {
                plotSettings: []
            },
            barchart: {
                plotSettings: []
            },
            table: {
                plotSettings: []
            },
            bubble: {
                plotSettings: []
            },
            cascade: {
                plotSettings: []
            }
        },
        warnings: [],
        ...props
    }
}

export const mockInputComparisonMetadata = (props: Partial<InputComparisonMetadata> = {}): InputComparisonMetadata => {
    return {
        filterTypes: [],
        indicators: [],
        plotSettingsControl: {
            inputComparisonBarchart: {
                plotSettings: []
            },
            inputComparisonTable: {
                plotSettings: []
            },
        },
        warnings: [],
        ...props
    }
}

export const mockComparisonPlotResponse = (props: Partial<ComparisonPlotResponse> = {}): ComparisonPlotResponse => {
    return {
        data: [{
            area_id: "MWI",
            area_name: "Test area",
            source: "Test Source",
            sex: "both",
            age_group: "1",
            calendar_quarter: "1",
            indicator_id: 1,
            indicator: 'mock',
            lower: 0.5,
            mean: 0.5,
            mode: 0.5,
            upper: 0.5
        }],
        metadata: {
            filterTypes: [],
            indicators: [],
            plotSettingsControl: {
                comparison: {
                    plotSettings: []
                }
            },
            warnings: []
        },
        ...props
    }
};

export const mockDataset = (props: Partial<Dataset> = {}): Dataset => {
    return {
        id: "123",
        title: "Some data",
        url: "www.some.url",
        resources: {
            pjnz: null,
            program: null,
            pop: null,
            survey: null,
            shape: null,
            anc: null,
            vmmc: null
        },
        organization: {
          id: "456"
        },
        ...props
    }
};

export const mockRelease = (props: Partial<Release> = {}): Release => {
    return {
        id: "releaseId",
        name: "releaseName",
        notes: "releaseNotes",
        activity_id: "activityId",
        ...props
    }
};

export const mockDatasetResource = (props: Partial<DatasetResource> = {}): DatasetResource => {
    return {
        id: "123",
        url: "www.something.com",
        lastModified: "2020-11-05T00:00:00",
        metadataModified: "2020-11-04T00:00:00",
        outOfDate: false,
        name: "mock-resource-name",
        ...props
    }
};

export const mockWarning = (props: Partial<Warning> = {}): Warning => {
    return {
        text: "be careful",
        locations: ["model_calibrate"],
        ...props
    };
};

export const mockDownloadResultsDependency = (props: Partial<DownloadResultsDependency> = {}): DownloadResultsDependency => {
    return {
        downloadId: "",
        fetchingDownloadId: false,
        preparing: false,
        statusPollId: -1,
        complete: false,
        error: null,
        downloadError: null,
        metadataError: null,
        statusResponse: null,
        ...props
    }
}


export const mockProjectOutputState = (props: Partial<DownloadSubmitRequest> = {}): DownloadSubmitRequest => {
    return {
        state: {
            datasets: {
                anc: {"filename": "anc", "path": "uploads/ancHash"},
                pjnz: {"filename": "pjnz", "path": "uploads/pjnzHash"},
                population: {"filename": "population", "path": "uploads/populationHash"},
                programme: {"filename": "program", "path": "uploads/programHash"},
                shape: {"filename": "shape", "path": "uploads/shapeHash"},
                survey: {"filename": "survey", "path": "uploads/surveyHash"}
            },
            model_fit: {"id": "modelRunId", "options": {"test": "options"}},
            calibrate: {"id": "calibrateId", "options": {"test": "options"}},
            version: {"hintr": "1.0.0", "naomi": "2.0.0", "rrq": "1.1.1"},
        },
        notes: {
            project_notes: {
                name: "My project 123",
                updated: "2022/06/09 14:56:19",
                note: "These are my project notes"
            },
            version_notes: []
        },
        ...props
    }
}

export const mockOptionsFormMeta = (props: Partial<DynamicFormMeta> = {}) => {
    return {
        controlSections: [{
            label: "Test Section",
            description: "Just a test section",
            controlGroups: [{
                controls: [{
                    name: "TestValue",
                    type: "number" as DynamicControlType,
                    required: false,
                    min: 0,
                    max: 10,
                    value: 5
                }]
            }]
        }],
        ...props
    }
};

export const mockDownloadIndicatorData = (props: Partial<DownloadIndicatorDataset> = {}): DownloadIndicatorDataset => {
    return {
        unfilteredData: [
            {
                "area_id": "MWI",
                "area_name": "Malawi",
                "value": 30
            },
            {
                "area_id": "MWI",
                "area_name": "Malawi",
                "value": 20
            },
        ],
        filteredData: [
            {
                "area_id": "MWI",
                "area_name": "Malawi",
                "value": 20
            }
        ],
        ...props
    }
}

export const mockReviewInputMetadata = (props: Partial<ReviewInputFilterMetadataResponse> = {}): ReviewInputFilterMetadataResponse => {
    return {
        filterTypes: [
            {
                id: "1",
                column_id: "1",
                options: [
                    {
                        id: "op1",
                        label: "lab1"
                    }
                ]
            }
        ],
        indicators: [
            {
                indicator: "prevalence",
                value_column: "indicator",
                name: "Prevalence",
                min: 0,
                max: 1,
                colour: "red",
                invert_scale: false,
                scale: 1,
                accuracy: null,
                format: "0.0%"
            }
        ],
        plotSettingsControl: {
            timeSeries: {
                plotSettings: []
            },
            inputChoropleth: {
                plotSettings: []
            }
        },
        ...props
    }
}


export const mockPlotMetadataFrame = (props: Partial<PlotMetadataFrame> = {}): PlotMetadataFrame => {
    return {
        filterTypes: [
            {
                id: "filterType1",
                column_id: "1",
                options: [
                    {
                        id: "op1",
                        label: "lab1"
                    },
                    {
                        id: "op2",
                        label: "lab2"
                    }
                ]
            },
            {
                id: "filterType2",
                column_id: "1",
                options: [
                    {
                        id: "op2",
                        label: "lab2"
                    }
                ]
            }
        ],
        indicators: [
            {
                indicator: "prevalence",
                value_column: "indicator",
                name: "Prevalence",
                min: 0,
                max: 1,
                colour: "red",
                invert_scale: false,
                scale: 1,
                accuracy: null,
                format: "0.0%"
            }
        ],
        plotSettingsControl: {
            choropleth: {
                plotSettings: []
            }
        },
        ...props
    };
}
