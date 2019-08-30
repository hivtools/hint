/**
  * This file was automatically generated.
  * DO NOT MODIFY IT BY HAND.
  * Instead, modify the hintr JSON schema files
  * and run ./generate-types.sh to regenerate this file.
*/
export interface Data {
  placeholder?: boolean;
}
export interface Error {
  error?: "INVALID_FILE" | "FAILED_TO_QUEUE" | "INVALID_PJNZ" | "OTHER_ERROR" | "FAILED_TO_CHECK_STATUS";
  detail?: string | null;
}
export type ErrorTypes = "INVALID_FILE" | "FAILED_TO_QUEUE" | "INVALID_PJNZ" | "OTHER_ERROR" | "FAILED_TO_CHECK_STATUS";
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
export type Response = Success | Failure;

export interface Success {
  status: "success";
  data:
    | (
        | {
            filename: string;
            type: "pjnz";
            data: {
              country: string;
            };
          }
        | {
            filename: string;
            type: "shape";
            data: GeoJSONObject;
          }
        | {
            filename: string;
            type: "population";
            data: null;
          })
    | {
        processId: string;
      }
    | (
        | {
            processId: string;
            complete: false;
            progress: number;
            timeRemaining: number;
          }
        | {
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
          });
  errors: {
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
export interface Failure {
  status: "failure";
  data: {
    [k: string]: any;
  };
  errors: [
    {
      error?: "INVALID_FILE" | "FAILED_TO_QUEUE" | "INVALID_PJNZ" | "OTHER_ERROR" | "FAILED_TO_CHECK_STATUS";
      detail?: string | null;
    },
    ...({
      error?: "INVALID_FILE" | "FAILED_TO_QUEUE" | "INVALID_PJNZ" | "OTHER_ERROR" | "FAILED_TO_CHECK_STATUS";
      detail?: string | null;
    })[]
  ];
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
export type ValidateInputResponse = PjnzResponse | ShapeResponse | PopulationResponse;

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
