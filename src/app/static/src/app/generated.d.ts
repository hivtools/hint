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
      programme: {
        [k: string]: any;
      };
      anc: {
        [k: string]: any;
      };
    };
  };
}
export interface InitialiseModelRunResponse {
  processId: string;
}
export type InputType = "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
export interface ModelRunInputData {
  programme: {
    [k: string]: any;
  };
  anc: {
    [k: string]: any;
  };
}
export interface ModelRunOptions {
  max_iterations: number;
  no_of_simulations: number;
  input_data: {
    programme: {
      [k: string]: any;
    };
    anc: {
      [k: string]: any;
    };
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
  complete: {
    [k: string]: any;
  };
  progress: number;
  timeRemaining: number;
}
export interface Complete {
  processId: string;
  complete: {
    [k: string]: any;
  };
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
export type Response = Success | Failure;

export interface Success {
  status: {
    [k: string]: any;
  };
  data:
    | string
    | {
        processId: string;
      }
    | (
        | {
            processId: string;
            complete: {
              [k: string]: any;
            };
            progress: number;
            timeRemaining: number;
          }
        | {
            processId: string;
            complete: {
              [k: string]: any;
            };
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
export interface Failure {
  status: {
    [k: string]: any;
  };
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
export type URI = string;
export interface ValidateInputRequest {
  type: "pjnz" | "shape" | "population" | "survey" | "programme" | "anc";
  path: string | null;
}
export type ValidateInputResponse = string;
