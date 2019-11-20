/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/
export interface AncFilters {
  year: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export type AncResponseData = {
  area_id: string;
  age_group?: string;
  year?: number;
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
export interface BarchartIndicator {
  indicator: string;
  value_column: string;
  indicator_column: string;
  indicator_value: string;
  name: string;
  error_low_column: string;
  error_high_column: string;
  [k: string]: any;
}
export interface BarchartMetadata {
  indicators: {
    indicator: string;
    value_column: string;
    indicator_column: string;
    indicator_value: string;
    name: string;
    error_low_column: string;
    error_high_column: string;
    [k: string]: any;
  }[];
  filters: {
    id: string;
    column_id: string;
    label: string;
    options: {
      label: string;
      id: string;
    }[];
    [k: string]: any;
  }[];
  [k: string]: any;
}
export interface ChoroplethIndicatorMetadata {
  indicator: string;
  value_column: string;
  indicator_column?: string;
  indicator_value?: string;
  name: string;
  min: number;
  max: number;
  colour: string;
  invert_scale: boolean;
}
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
export interface Filter {
  id: string;
  column_id: string;
  label: string;
  options: {
    label: string;
    id: string;
  }[];
  [k: string]: any;
}
export interface FilterOption {
  label: string;
  id: string;
}
export interface HintrVersionResponse {
  [k: string]: string;
}
export interface HintrWorkerStatus {
  [k: string]: "BUSY" | "IDLE" | "PAUSED" | "EXITED" | "LOST";
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
  age_group: string;
  calendar_quarter: string;
  indicator_id: number;
  mode: number;
  mean: number;
  lower: number;
  upper: number;
  [k: string]: any;
}[];
export interface ModelResultFilters {
  age: {
    label: string;
    id: string;
  }[];
  quarter: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export interface ModelResultResponse {
  data?: {
    area_id: string;
    sex: string;
    age_group: string;
    calendar_quarter: string;
    indicator_id: number;
    mode: number;
    mean: number;
    lower: number;
    upper: number;
    [k: string]: any;
  }[];
  plottingMetadata?: {
    barchart: {
      indicators: {
        indicator: string;
        value_column: string;
        indicator_column: string;
        indicator_value: string;
        name: string;
        error_low_column: string;
        error_high_column: string;
        [k: string]: any;
      }[];
      filters: {
        id: string;
        column_id: string;
        label: string;
        options: {
          label: string;
          id: string;
        }[];
        [k: string]: any;
      }[];
      [k: string]: any;
    };
  };
  [k: string]: any;
}
export interface ModelRunOptions {
  controlSections: ControlSection[];
}
export interface ControlSection {
  label: string;
  description?: string;
  controlGroups: ControlGroup[];
}
export interface ControlGroup {
  label?: string;
  controls: (SelectControl | NumberControl)[];
}
export interface SelectControl {
  name: string;
  label?: string;
  type: "select" | "multiselect";
  required: boolean;
  value?: string;
  helpText?: string;
  options?: {
    id: string;
    label: string;
    children?: {
      [k: string]: any;
    }[];
  }[];
}
export interface NumberControl {
  name: string;
  label?: string;
  type: "number";
  required: boolean;
  value?: number;
  helpText?: string;
  min?: number;
  max?: number;
}
export interface ModelRunOptionsRequest {
  shape: {
    path: string | null;
    hash: string;
    filename: string;
  };
  survey: {
    path: string | null;
    hash: string;
    filename: string;
  };
  programme?: {
    path: string | null;
    hash: string;
    filename: string;
  };
  anc?: {
    path: string | null;
    hash: string;
    filename: string;
  };
}
export interface ModelStatusResponse {
  id: string;
  done: boolean | null;
  status: string;
  success: boolean | null;
  queue: number;
  progress: {
    started: boolean;
    complete: boolean;
    value?: number;
    name: string;
    helpText?: string;
  }[];
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
export interface ModelSubmitRequest {
  data: {
    pjnz: string | null;
    shape: string | null;
    population: string | null;
    survey: string | null;
    programme: string | null;
    anc: string | null;
  };
  options: {
    [k: string]: any;
  };
}
export interface ModelSubmitResponse {
  id: string;
}
export interface NestedFilterOption {
  label: string;
  id: string;
  children?: {
    [k: string]: any;
  }[];
}
export interface PjnzResponseData {
  country: string;
  iso3: string;
}
export type ChoroplethMetadata = {
  indicator: string;
  value_column: string;
  indicator_column?: string;
  indicator_value?: string;
  name: string;
  min: number;
  max: number;
  colour: string;
  invert_scale: boolean;
}[];

export interface PlottingMetadataResponse {
  survey: Metadata;
  anc: Metadata;
  programme: Metadata;
  output: Metadata;
}
export interface Metadata {
  choropleth?: {
    indicators?: ChoroplethMetadata;
    [k: string]: any;
  };
  [k: string]: any;
}
export type PopulationResponseData = null;
export interface ProgrammeFilters {
  age: {
    label: string;
    id: string;
  }[];
  year: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export type ProgrammeResponseData = {
  area_id: string;
  current_art: number;
  [k: string]: any;
}[];
export interface ProgressPhase {
  started: boolean;
  complete: boolean;
  value?: number;
  name: string;
  helpText?: string;
}
export interface Response {
  status: "success" | "failure";
  data: {
    [k: string]: any;
  };
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
  name?: string;
  features: {
    [k: string]: any;
  }[];
  [k: string]: any;
}
export interface SurveyFilters {
  age: {
    label: string;
    id: string;
  }[];
  surveys: {
    label: string;
    id: string;
  }[];
  indicators: {
    label: string;
    id: string;
  }[];
}
export type SurveyResponseData = {
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
    iso3: string;
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
      label: string;
      id: string;
      children?: {
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
  name?: string;
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
      label: string;
      id: string;
    }[];
    year: {
      label: string;
      id: string;
    }[];
    indicators: {
      label: string;
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
    age_group?: string;
    year?: number;
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
    year: {
      label: string;
      id: string;
    }[];
    indicators: {
      label: string;
      id: string;
    }[];
  };
}
export interface SurveyResponse {
  hash: string;
  filename: string;
  type: "survey";
  data: {
    area_id: string;
    survey_id: string;
    [k: string]: any;
  }[];
  filters: {
    age: {
      label: string;
      id: string;
    }[];
    surveys: {
      label: string;
      id: string;
    }[];
    indicators: {
      label: string;
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
