/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/
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
export interface InitialiseModelRunRequest {
  pjnz: string | null;
  shape: string | null;
  population: string | null;
  survey: string | null;
  programme: string | null;
  anc: string | null;
  options: {
    max_iterations: number;
    no_of_simulations: number;
    input_data: {
      programme: boolean;
      anc: boolean;
    };
  };
}
export interface InitialiseModelRunResponse {
  processId: string;
}
export type InputType = "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
export interface ModelRunInputData {
  programme: boolean;
  anc: boolean;
}
export interface ModelRunOptions {
  max_iterations: number;
  no_of_simulations: number;
  input_data: {
    programme: boolean;
    anc: boolean;
  };
}
export interface ModelRunResult {
  plhiv: {
    placeholder?: boolean;
  };
  prevalence: {
    placeholder?: boolean;
  };
  art: {
    placeholder?: boolean;
  };
  incidence: {
    placeholder?: boolean;
  };
}
export interface ModelRunResultRequest {
  processId: string;
}
export type ModelRunResultResponse = Incomplete | Complete;

export interface Incomplete {
  processId: string;
  complete: false;
  progress: number;
  timeRemaining: number;
}
export interface Complete {
  processId: string;
  complete: true;
  result: {
    plhiv: {
      placeholder?: boolean;
    };
    prevalence: {
      placeholder?: boolean;
    };
    art: {
      placeholder?: boolean;
    };
    incidence: {
      placeholder?: boolean;
    };
  };
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
export type URI = string;
export interface ValidateInputRequest {
  type: "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
  path: string | null;
}
export type ValidateInputResponse = PjnzResponse | ShapeResponse | PopulationResponse | ProgrammeResponse;

export interface PjnzResponse {
  filename: string;
  type: "pjnz";
  data: {
    country: string;
  };
}
export interface ShapeResponse {
  filename: string;
  type: "shape";
  data: GeoJSONObject;
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
}
export interface ProgrammeResponse {
  filename: string;
  type: "programme";
  data: {
    iso3: string;
    area_id: string;
    [k: string]: any;
  }[];
}
