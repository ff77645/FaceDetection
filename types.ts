export enum AppState {
  IDLE = 'IDLE',
  LOADING_MODEL = 'LOADING_MODEL',
  CAMERA_ACTIVE = 'CAMERA_ACTIVE',
  PHOTO_TAKEN = 'PHOTO_TAKEN',
  ANALYZING = 'ANALYZING',
  ERROR = 'ERROR'
}

export interface FaceDetectionStatus {
  detected: boolean;
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisResult {
  description: string;
  expression: string;
  sentiment: string;
}
