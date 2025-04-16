export interface AssetImageDto {
  brandLogoUrl?: string;
  question?: string;
  answer: string;
  author: {
    name: string;
    designation: string;
    image?: string;
  };
  accentColor?: string;
  type?:
    | "text"
    | "video"
    | "rating"
    | "rating-summary"
    | "multiple-choice"
    | "multiple-choice-individual"
    | "google"
    | "linkedin"
    | "youtube"
    | "multiple-choice-text";
  thumbnailUrl?: string;
  rating?: {
    score: number;
    maxScore: number;
    type?: string;
  };
  numberOfResponses?: number;
  companyName?: string;
  choices?: {
    answer: string;
  }[];
  ratingDistribution?: {
    values: number[];
    maxValue: number;
    labels?: {
      left?: string;
      center?: string;
      right?: string;
    };
  };
  multipleChoice?: {
    options: Array<{
      text: string;
      percentage: number;
    }>;
  };
  youtube?: {
    videoLink?: string;
    channelPhoto?: string;
    channelName?: string;
    channelHandle?: string;
  };
  multipleChoiceText?: {
    option: string;
    percentage?: string;
  };
} 