/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/
export interface AgeFilters {
  age: {
    name: string;
    id: string;
  }[];
}
export type AncResponseData = {
  iso3: string;
  area_id: string;
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
export type InputType = "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
export type ModelResultResponse = number;
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
  name?: string;
  id?: string;
  options?: {
    [k: string]: any;
  }[];
}
export interface PjnzResponseData {
  country: string;
}
export type PopulationResponseData = null;
export type ProgrammeResponseData = {
  iso3: string;
  area_id: string;
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
  path: string | null;
}
export type ValidateInputResponse =
  | PjnzResponse
  | ShapeResponse
  | PopulationResponse
  | ProgrammeResponse
  | AncResponse
  | SurveyResponse;

export interface PjnzResponse {
  filename: string;
  type: "pjnz";
  data: {
    country: string;
  };
  filters?: null;
}
export interface ShapeResponse {
  filename: string;
  type: "shape";
  data: GeoJSONObject;
  filters: {
    regions?: {
      name?: string;
      id?: string;
      options?: {
        [k: string]: any;
      }[];
    }[];
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
  filename: string;
  type: "population";
  data: null;
  filters?: null;
}
export interface ProgrammeResponse {
  filename: string;
  type: "programme";
  data: {
    iso3: string;
    area_id: string;
    [k: string]: any;
  }[];
  filters: {
    age: {
      name: string;
      id: string;
    }[];
  };
}
export interface AncResponse {
  filename: string;
  type: "anc";
  data: {
    iso3: string;
    area_id: string;
    [k: string]: any;
  }[];
  filters: {
    age: {
      name: string;
      id: string;
    }[];
  };
}
export interface SurveyResponse {
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
