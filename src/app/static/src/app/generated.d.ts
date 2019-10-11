/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/
export interface AncFilters {
  quarter: {
    name: string;
    id: string;
  }[];
}
export type AncResponseData = {
  area_id: string;
  age_group_id?: number;
  quarter_id?: number;
  anc_clients?: number;
  ancrt_hiv_status?: number;
  ancrt_known_pos?: number;
  ancrt_already_art?: number;
  ancrt_tested?: number;
  ancrt_test_pos?: number;
  prevalence?: number;
  art_coverage?: number;
  [k: string]: any;
}[];
export interface Data {
  placeholder?: boolean;
}
export type ErrorCode = string;
export interface Error {
  error?: string;
  detail?: string | null;
}
export type FileName = string;
export type FilePath = string | null;
export interface FilterOption {
  name: string;
  id: string;
}
export interface IndicatorMetadata {
  value_column: string;
  indicator_column?: string;
  indicator_value?: string;
  name: string;
  min: number;
  max: number;
  colour: string;
  invert_scale: boolean;
}
export type InputType = "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
export interface LevelLabels {
  id: number;
  area_level_label: string;
  display: boolean;
}
export type ModelResultData = {
  area_id: string;
  sex: string;
  age_group_id: number;
  quarter_id: number;
  indicator_id: number;
  mode: number;
  mean: number;
  lower: number;
  upper: number;
  [k: string]: any;
}[];
export interface ModelResultFilters {
  age: {
    name: string;
    id: string;
  }[];
  quarter: {
    name: string;
    id: string;
  }[];
  indicator: {
    name: string;
    id: string;
  }[];
}
export interface ModelResultResponse {
  data?: {
    area_id: string;
    sex: string;
    age_group_id: number;
    quarter_id: number;
    indicator_id: number;
    mode: number;
    mean: number;
    lower: number;
    upper: number;
    [k: string]: any;
  }[];
  filters?: {
    age: {
      name: string;
      id: string;
    }[];
    quarter: {
      name: string;
      id: string;
    }[];
    indicator: {
      name: string;
      id: string;
    }[];
  };
  [k: string]: any;
}
export interface ModelStatusResponse {
  id: string;
  done: boolean | null;
  status: string;
  success: boolean | null;
  queue: number;
  progress: string;
  timeRemaining: string;
}
export interface ModelSubmitData {
  pjnz: string | null;
  shape: string | null;
  population: string | null;
  survey: string | null;
  programme: string | null;
  anc: string | null;
}
export interface ModelSubmitInputOptions {
  programme: boolean;
  anc: boolean;
}
export interface ModelSubmitParameters {
  max_iterations: number;
  no_of_simulations: number;
  options: {
    programme: boolean;
    anc: boolean;
  };
  [k: string]: any;
}
export interface ModelSubmitRequest {
  data: {
    pjnz: string | null;
    shape: string | null;
    population: string | null;
    survey: string | null;
    programme: string | null;
    anc: string | null;
  };
  parameters: {
    max_iterations: number;
    no_of_simulations: number;
    options: {
      programme: boolean;
      anc: boolean;
    };
    [k: string]: any;
  };
}
export interface ModelSubmitResponse {
  id: string;
}
export interface NestedFilterOption {
  name: string;
  id: string;
  options?: {
    [k: string]: any;
  }[];
}
export interface PjnzResponseData {
  country: string;
}
export interface PlottingMetadataResponse {
  survey: PrevalenceAndArtCoverageChoropleth;
  anc: PrevalenceAndArtCoverageChoropleth;
  programme: CurrentArtChoropleth;
  output: PrevalenceAndArtCoverageChoropleth;
}
export interface PrevalenceAndArtCoverageChoropleth {
  choropleth?: {
    indicators?: PrevalenceAndArtCoverageIndicators;
    [k: string]: any;
  };
  [k: string]: any;
}
export interface PrevalenceAndArtCoverageIndicators {
  prevalence?: {
    value_column: string;
    indicator_column?: string;
    indicator_value?: string;
    name: string;
    min: number;
    max: number;
    colour: string;
    invert_scale: boolean;
  };
  art_coverage?: {
    value_column: string;
    indicator_column?: string;
    indicator_value?: string;
    name: string;
    min: number;
    max: number;
    colour: string;
    invert_scale: boolean;
  };
  [k: string]: any;
}
export interface CurrentArtChoropleth {
  choropleth?: {
    indicators?: CurrentArtIndicator;
    [k: string]: any;
  };
  [k: string]: any;
}
export interface CurrentArtIndicator {
  current_art?: {
    value_column: string;
    indicator_column?: string;
    indicator_value?: string;
    name: string;
    min: number;
    max: number;
    colour: string;
    invert_scale: boolean;
  };
  [k: string]: any;
}
export type PopulationResponseData = null;
export interface ProgrammeFilters {
  age: {
    name: string;
    id: string;
  }[];
  quarter: {
    name: string;
    id: string;
  }[];
}
export type ProgrammeResponseData = {
  area_id: string;
  current_art: number;
  [k: string]: any;
}[];
export interface Response {
  status: "success" | "failure";
  data: any;
  errors: {
    error?: string;
    detail?: string | null;
  }[];
}
export interface SessionFile {
  path: string | null;
  hash: string;
  filename: string;
}
/**
 * TODO: Validate against a URL e.g. https://geojson.org/schema/FeatureCollection.json
 */
export interface GeoJSONObject {
  type: "FeatureCollection";
  crs?: {
    [k: string]: any;
  };
  name?: {
    [k: string]: any;
  };
  features: {
    [k: string]: any;
  }[];
  [k: string]: any;
}
export interface SurveyFilters {
  age: {
    name: string;
    id: string;
  }[];
  surveys: {
    name: string;
    id: string;
  }[];
}
export type SurveyResponseData = {
  iso3: string;
  area_id: string;
  survey_id: string;
  [k: string]: any;
}[];
export type URI = string;
export interface ValidateBaselineRequest {
  pjnz: string | null;
  shape: string | null;
  population: string | null;
}
export interface ValidateBaselineResponse {
  complete: boolean;
  consistent: boolean;
}
export interface ValidateInputRequest {
  type: "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
  file: {
    path: string | null;
    hash: string;
    filename: string;
  };
}
export type ValidateInputResponse =
  | PjnzResponse
  | ShapeResponse
  | PopulationResponse
  | ProgrammeResponse
  | AncResponse
  | SurveyResponse;

export interface PjnzResponse {
  hash: string;
  filename: string;
  type: "pjnz";
  data: {
    country: string;
  };
  filters?: null;
}
export interface ShapeResponse {
  hash: string;
  filename: string;
  type: "shape";
  data: GeoJSONObject;
  filters: {
    level_labels?: {
      id: number;
      area_level_label: string;
      display: boolean;
    }[];
    regions?: {
      name: string;
      id: string;
      options?: {
        [k: string]: any;
      }[];
    };
    [k: string]: any;
  };
}
/**
 * TODO: Validate against a URL e.g. https://geojson.org/schema/FeatureCollection.json
 */
export interface GeoJSONObject {
  type: "FeatureCollection";
  crs?: {
    [k: string]: any;
  };
  name?: {
    [k: string]: any;
  };
  features: {
    [k: string]: any;
  }[];
  [k: string]: any;
}
export interface PopulationResponse {
  hash: string;
  filename: string;
  type: "population";
  data: null;
  filters?: null;
}
export interface ProgrammeResponse {
  hash: string;
  filename: string;
  type: "programme";
  data: {
    area_id: string;
    current_art: number;
    [k: string]: any;
  }[];
  filters: {
    age: {
      name: string;
      id: string;
    }[];
    quarter: {
      name: string;
      id: string;
    }[];
  };
}
export interface AncResponse {
  hash: string;
  filename: string;
  type: "anc";
  data: {
    area_id: string;
    age_group_id?: number;
    quarter_id?: number;
    anc_clients?: number;
    ancrt_hiv_status?: number;
    ancrt_known_pos?: number;
    ancrt_already_art?: number;
    ancrt_tested?: number;
    ancrt_test_pos?: number;
    prevalence?: number;
    art_coverage?: number;
    [k: string]: any;
  }[];
  filters: {
    quarter: {
      name: string;
      id: string;
    }[];
  };
}
export interface SurveyResponse {
  hash: string;
  filename: string;
  type: "survey";
  data: {
    iso3: string;
    area_id: string;
    survey_id: string;
    [k: string]: any;
  }[];
  filters: {
    age: {
      name: string;
      id: string;
    }[];
    surveys: {
      name: string;
      id: string;
    }[];
  };
}
export interface ValidateSurveyAndProgrammeRequest {
  type: "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
  file: {
    path: string | null;
    hash: string;
    filename: string;
  };
  shape: string | null;
}
